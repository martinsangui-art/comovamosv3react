import { useState, useEffect, useCallback } from 'react'

const API = 'https://script.google.com/macros/s/AKfycbyqeOBpxtYxavx-Uc8mTVRhsqb6HhY6N1RETcvNNVorRuuHMb111XLh_pVYhbSBry4/exec'
const WEBHOOK = 'https://hook.us2.make.com/3xhcn02owq56c196s0j3anawf5zesxht'

// JSONP helper — única forma confiable de llamar Apps Script desde el browser
function jsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const cb = '_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    let url = `${API}?action=${action}&callback=${cb}`
    Object.entries(params).forEach(([k, v]) => { url += `&${k}=${encodeURIComponent(v)}` })

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout al conectar con Google Sheets'))
    }, 20000)

    window[cb] = (data) => {
      cleanup()
      if (data?.ok) resolve(data.data)
      else reject(new Error(data?.error || 'Error en la API'))
    }

    function cleanup() {
      clearTimeout(timeout)
      delete window[cb]
      if (el?.parentNode) el.parentNode.removeChild(el)
    }

    const el = document.createElement('script')
    el.src = url
    el.onerror = () => { cleanup(); reject(new Error('Error de red')) }
    document.head.appendChild(el)
  })
}

function post(body) {
  return fetch(API, { method: 'POST', body: JSON.stringify(body) })
    .then(r => r.text())
    .then(t => {
      const r = JSON.parse(t)
      if (!r.ok) throw new Error(r.error)
      return r.data
    })
}

export function useSheets() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    campanas: [],
    sedes: [],
    campanaActiva: null,
    data: [],           // semana actual procesada
    historial: [],      // historial completo
  })

  const [copied, setCopied] = useState({})  // {cod: true}

  // Carga inicial
  useEffect(() => {
    Promise.all([jsonp('campanas'), jsonp('sedes')])
      .then(([campanas, sedes]) => {
        const activa = campanas.find(c => c.estado === 'activa') || campanas[campanas.length - 1]
        setState(s => ({ ...s, campanas, sedes, campanaActiva: activa?.id || null, loading: false }))
      })
      .catch(err => setState(s => ({ ...s, loading: false, error: err.message })))
  }, [])

  // Cargar datos cuando cambia campaña activa
  const cargarCampana = useCallback((campanaId) => {
    setState(s => ({ ...s, loading: true, error: null, campanaActiva: campanaId, data: [] }))
    setCopied({})

    Promise.all([
      jsonp('semana_actual', { campana: campanaId }),
      jsonp('historial', { campana: campanaId }),
    ]).then(([data, historial]) => {
      setState(s => ({ ...s, loading: false, data, historial }))
    }).catch(err => {
      setState(s => ({ ...s, loading: false, error: err.message }))
    })
  }, [])

  useEffect(() => {
    if (state.campanaActiva) cargarCampana(state.campanaActiva)
  }, [state.campanaActiva === null ? null : state.campanaActiva]) // eslint-disable-line

  // Marcar sede como copiada
  const markCopied = useCallback((cod) => {
    setCopied(prev => ({ ...prev, [cod]: true }))
  }, [])

  // Reemplaza el estado completo (útil para desmarcar también)
  const markAllCopied = useCallback((cods) => {
    if (Array.isArray(cods)) {
      // Si es array, marcar esos como true
      setCopied(prev => {
        const next = { ...prev }
        cods.forEach(c => { next[c] = true })
        return next
      })
    } else {
      // Si es objeto, reemplazar estado completo
      setCopied(cods)
    }
  }, [])

  // Guardar semana nueva en Sheets
  const guardarSemana = useCallback(async (fecha, sedesData) => {
    const camp = state.campanas.find(c => c.id === state.campanaActiva)
    const result = await post({
      action: 'agregar_semana',
      campana_id: state.campanaActiva,
      campana_nombre: camp?.nombre || '',
      fecha,
      sedes: sedesData,
    })
    // Recargar datos
    cargarCampana(state.campanaActiva)
    return result
  }, [state.campanaActiva, state.campanas, cargarCampana])

  // Enviar email individual via Make
  const enviarEmail = useCallback(async (d) => {
    const camp = state.campanas.find(c => c.id === state.campanaActiva)
    await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sede: d.sede, email: d.email, saludo: d.saludo,
        total: d.total, objetivo: d.objetivo, pct: d.pct,
        var: d.var, fecha: d.fecha, campana: camp?.nombre || '',
      }),
    })
    markCopied(d.cod_sede)
  }, [state.campanaActiva, state.campanas, markCopied])

  // Stats derivadas
  const stats = (() => {
    const { data } = state
    if (!data.length) return { total: 0, enObj: 0, enProg: 0, sinIng: 0, sinAv: 0, pctGlobal: 0, totalIng: 0, totalObj: 0 }
    let totalIng = 0, totalObj = 0, enObj = 0, enProg = 0, sinIng = 0, sinAv = 0
    data.forEach(d => {
      totalIng += d.total; totalObj += d.objetivo
      const pct = d.pct || 0
      if (d.total === 0) sinIng++
      else if (pct >= 50) enObj++
      else enProg++
      if (d.var === 0) sinAv++
    })
    return {
      total: data.length, enObj, enProg, sinIng, sinAv,
      pctGlobal: totalObj > 0 ? Math.round(totalIng / totalObj * 100) : 0,
      totalIng, totalObj,
    }
  })()

  // Subir Excel — parsea y guarda como nueva semana
  const subirExcel = useCallback(async (sedesData, fileName) => {
    // Inferir fecha del nombre del archivo o usar hoy
    let fecha = new Date().toISOString().slice(0,10)
    const matchFecha = fileName?.match(/(\d{4}[-_]\d{2}[-_]\d{2})/)
    if (matchFecha) fecha = matchFecha[1].replace(/_/g, '-')

    // Matchear sedes del Excel con sedes del Sheet por código o nombre
    const sedesSheet = state.sedes || []
    const sedesConCod = sedesData.map(s => {
      // Buscar por código primero
      let match = sedesSheet.find(sh => String(sh.cod_sede) === String(s.cod))
      // Si no, buscar por nombre
      if (!match) match = sedesSheet.find(sh => sh.sede?.toLowerCase().includes(s.sede?.toLowerCase().slice(0,6)))
      return {
        cod: match ? match.cod_sede : s.cod,
        sede: match ? match.sede : s.sede,
        total: s.total,
      }
    }).filter(s => s.total !== undefined)

    const camp = state.campanas?.find(c => c.id === state.campanaActiva)
    return await post({
      action: 'agregar_semana',
      campana_id: state.campanaActiva,
      campana_nombre: camp?.nombre || '',
      fecha,
      sedes: sedesConCod,
    }).then(res => {
      cargarCampana(state.campanaActiva)
      return res
    })
  }, [state.campanaActiva, state.campanas, state.sedes, cargarCampana])

  return {
    ...state,
    copied,
    stats,
    cargarCampana,
    markCopied,
    markAllCopied,
    guardarSemana,
    subirExcel,
    enviarEmail,
    WEBHOOK,
  }
}

export { post, jsonp }
