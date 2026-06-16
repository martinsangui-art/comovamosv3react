import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#1B2A6B','#C8102E','#059669','#d97706','#7c3aed']

export default function Historial({ historial, data }) {
  const [tab, setTab] = useState(1) // 1=tabla, 2=evolución, 3=comparar
  const [busq, setBusq] = useState('')
  const [sedesComp, setSedesComp] = useState([])

  // Fechas únicas ordenadas
  const fechas = useMemo(() => {
    const set = new Set(historial.map(r => r.fecha))
    return [...set].sort()
  }, [historial])

  // Sedes únicas
  const todasSedes = useMemo(() => {
    const map = {}
    historial.forEach(r => { if (!map[r.cod_sede]) map[r.cod_sede] = r.sede })
    return Object.entries(map).sort(([,a],[,b]) => a.localeCompare(b))
  }, [historial])

  // Historial por sede (para tabla tipo original)
  const historialPorSede = useMemo(() => {
    const map = {}
    historial.forEach(r => {
      if (!map[r.cod_sede]) map[r.cod_sede] = { sede: r.sede, vals: {} }
      map[r.cod_sede].vals[r.fecha] = Number(r.total) || 0
    })
    return map
  }, [historial])

  // Tabla semana actual filtrada
  const tablaActual = useMemo(() => {
    return data.filter(d => !busq || d.sede.toLowerCase().includes(busq.toLowerCase()))
      .sort((a,b) => b.pct - a.pct)
  }, [data, busq])

  // Datos para gráfico comparativo
  const datosComp = useMemo(() => {
    if (!sedesComp.length) return []
    return fechas.map(fecha => {
      const row = { fecha: fecha.slice(5) }
      sedesComp.forEach(cod => {
        const entry = historial.find(r => r.fecha === fecha && String(r.cod_sede) === String(cod))
        if (entry) {
          const obj = Number(entry.objetivo) || 0
          const tot = Number(entry.total) || 0
          row[cod] = obj > 0 ? Math.round(tot / obj * 100) : 0
        }
      })
      return row
    })
  }, [sedesComp, fechas, historial])

  const toggleSede = (cod) => {
    setSedesComp(prev =>
      prev.includes(cod) ? prev.filter(c => c !== cod) :
      prev.length < 5 ? [...prev, cod] : prev
    )
  }

  const sedeNombre = (cod) => todasSedes.find(([c]) => c === cod)?.[1] || cod

  const tabBtn = (n, label) => (
    <button onClick={() => setTab(n)} style={{
      flex: 1, padding: '10px 16px', border: 'none', cursor: 'pointer',
      background: tab === n ? '#fff' : '#f8fafc',
      color: tab === n ? '#1B2A6B' : '#94a3b8',
      fontWeight: tab === n ? 700 : 500, fontSize: 12,
      borderBottom: tab === n ? '2px solid #1B2A6B' : '2px solid transparent',
      transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Tabs */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {tabBtn(1, '📋 Semana actual')}
          {tabBtn(2, '📈 Evolución histórica')}
          {tabBtn(3, '🔄 Comparar sedes')}
        </div>

        {/* TAB 1: Semana actual */}
        {tab === 1 && (
          <div className="animate-fadeIn">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <input type="text" value={busq} onChange={e => setBusq(e.target.value)}
                placeholder="Buscar sede…"
                style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 200 }} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Estado','Sede','Objetivo','Ingresados','Faltan','Var. semana','Cumplimiento'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === 'Estado' || h === 'Sede' ? 'left' : 'center',
                        fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
                        letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tablaActual.map((d, i) => {
                    const pct = d.pct || 0
                    const col = pct >= 50 ? '#16a34a' : pct > 0 ? '#d97706' : '#be123c'
                    const dotC = col
                    const icon = pct >= 50 ? '✅' : pct > 0 ? '⚠️' : '❌'
                    const noav = d.var === 0
                    const diff = d.var
                    const varEl = diff === null ? '—' : diff > 0
                      ? <span style={{ color:'#16a34a',fontWeight:700 }}>+{diff} ▲</span>
                      : diff < 0
                        ? <span style={{ color:'#be123c',fontWeight:700 }}>{diff} ▼</span>
                        : <span style={{ color:'#9ca3af' }}>= sin cambio</span>
                    const faltan = Math.max(0, d.objetivo - d.total)
                    return (
                      <tr key={d.cod_sede} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: noav ? '#fffdf0' : 'transparent',
                      }}>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotC, flexShrink: 0 }} />
                            <span>{icon}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 20 }}>{d.cod_sede}</span>
                            <span style={{ fontWeight: 600 }}>{d.sede}</span>
                            {noav && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>⚠ sin avance</span>}
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{d.objetivo}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d.total}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'center', color: faltan > 0 ? '#be123c' : '#16a34a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{faltan > 0 ? faltan : '✓'}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'center' }}>{varEl}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 140 }}>
                            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 20, background: col, transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: col, width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Evolución histórica tipo tabla */}
        {tab === 2 && (
          <div className="animate-fadeIn">
            {fechas.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Sin datos históricos
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
                  {fechas.length} semanas registradas · Columna azul = semana actual
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f5f3ff' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', borderBottom: '2px solid #ddd6fe', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#f5f3ff' }}>Sede</th>
                        {fechas.map(f => (
                          <th key={f} style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', borderBottom: '2px solid #ddd6fe', whiteSpace: 'nowrap' }}>
                            {f.slice(5).replace('-','/')}
                          </th>
                        ))}
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', borderBottom: '2px solid #ddd6fe', whiteSpace: 'nowrap', background: '#dbeafe' }}>Hoy</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', borderBottom: '2px solid #ddd6fe' }}>Tendencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todasSedes.map(([cod, nombre]) => {
                        const entry = historialPorSede[cod]
                        const vals = fechas.map(f => entry?.vals[f] ?? null)
                        const valsCon = vals.filter(v => v !== null)
                        const curr = data.find(d => String(d.cod_sede) === String(cod))
                        let tendencia = null
                        if (valsCon.length >= 2) {
                          const delta = valsCon[valsCon.length-1] - valsCon[0]
                          tendencia = delta > 0
                            ? <span style={{ color:'#16a34a',fontWeight:700 }}>{delta>=5?'🚀':delta>=3?'📈':'⬆️'} +{delta}</span>
                            : delta < 0
                              ? <span style={{ color:'#be123c',fontWeight:700 }}>📉 {delta}</span>
                              : <span style={{ color:'#9ca3af' }}>➡️ sin cambio</span>
                        }
                        return (
                          <tr key={cod} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '7px 12px', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 20 }}>{cod}</span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{nombre}</span>
                              </div>
                            </td>
                            {vals.map((v, i) => {
                              if (v === null) return <td key={i} style={{ padding: '7px 12px', textAlign: 'center', color: '#d1d5db' }}>—</td>
                              const bg = v === 0 ? '#fff1f2' : v < 3 ? '#fffbeb' : '#f0fdf4'
                              const col = v === 0 ? '#be123c' : v < 3 ? '#b45309' : '#15803d'
                              return <td key={i} style={{ padding: '7px 12px', textAlign: 'center', background: bg, color: col, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</td>
                            })}
                            <td style={{ padding: '7px 12px', textAlign: 'center', background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                              {curr ? curr.total : '—'}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'center' }}>{tendencia || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: Comparar sedes */}
        {tab === 3 && (
          <div className="animate-fadeIn" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Seleccioná hasta 5 sedes para comparar</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {todasSedes.map(([cod, nombre], i) => {
                const sel = sedesComp.includes(cod)
                const ci = sedesComp.indexOf(cod)
                return (
                  <button key={cod} onClick={() => toggleSede(cod)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: sel ? `2px solid ${COLORS[ci]}` : '1px solid #e2e8f0',
                    background: sel ? COLORS[ci] + '15' : '#fff',
                    color: sel ? COLORS[ci] : '#64748b',
                  }}>{nombre.replace(/ - BUENOS AIRES.*/, '').replace(/ - BS AS$/, '')}</button>
                )
              })}
            </div>
            {sedesComp.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>
                Seleccioná al menos una sede
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={datosComp} margin={{ top: 4, right: 24, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
                  <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                    formatter={(v, name) => [v !== undefined ? v + '%' : '—', sedeNombre(name)]} />
                  <Legend formatter={sedeNombre} />
                  {sedesComp.map((cod, i) => (
                    <Line key={cod} type="monotone" dataKey={cod} stroke={COLORS[i]} strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS[i], strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
