import { useState, useMemo } from 'react'

function getEstado(d) {
  if (d.total === 0) return 'red'
  if (d.pct >= 50) return 'green'
  return 'amber'
}

const ESTADOS = {
  green: { label: 'En objetivo',  color: '#059669', bg: '#ecfdf5', dot: '#6ee7b7' },
  amber: { label: 'En progreso',  color: '#d97706', bg: '#fffbeb', dot: '#fde68a' },
  red:   { label: 'Sin ingresos', color: '#e11d48', bg: '#fff1f2', dot: '#fecdd3' },
}

function Badge({ estado }) {
  const e = ESTADOS[estado]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: e.color, background: e.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
      {e.label}
    </span>
  )
}

function ProgressBar({ pct, estado }) {
  const colors = { green: '#059669', amber: '#d97706', red: '#e11d48' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, pct)}%`, height: '100%',
          background: colors[estado], borderRadius: 3,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors[estado], width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </span>
    </div>
  )
}

function generarEmail(d, campNombre) {
  const est = getEstado(d)
  const color = { green: '#059669', amber: '#d97706', red: '#e11d48' }[est]
  const emoji = { green: '✅', amber: '⚠️', red: '❌' }[est]
  const varTxt = d.var !== null
    ? (d.var > 0 ? ` (+${d.var} vs semana anterior)` : d.var < 0 ? ` (${d.var} vs semana anterior)` : ' (sin variación)')
    : ''

  return `<p>${d.saludo}:</p>
<p>Te compartimos la actualización semanal de ingresos correspondiente a la campaña <strong>${campNombre}</strong>.</p>
<table style="border-collapse:collapse;width:100%;max-width:400px;margin:16px 0">
  <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600">Sede</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${d.sede}</td></tr>
  <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600">Fecha</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${d.fecha}</td></tr>
  <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600">Ingresados</td><td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>${d.total}</strong>${varTxt}</td></tr>
  <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600">Objetivo</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${d.objetivo}</td></tr>
  <tr><td style="padding:8px 12px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600">Cumplimiento</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:${color};font-weight:700">${emoji} ${d.pct}%</td></tr>
</table>
<p>Quedamos a disposición ante cualquier consulta.</p>
<p>Saludos cordiales,<br>Dirección Operativa SEAD – UCASAL Buenos Aires</p>`
}

async function copiarHTML(html) {
  try {
    const blob = new Blob([html], { type: 'text/html' })
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
    return true
  } catch {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    await navigator.clipboard.writeText(tmp.innerText)
    return true
  }
}

export default function Sedes({ data, copied, onCopied, onCopiedAll, campanas, campanaActiva }) {
  const [filtro, setFiltro] = useState('')
  const [busq, setBusq] = useState('')
  const [expandida, setExpandida] = useState(null)
  const [toast, setToast] = useState(null)

  const camp = campanas?.find(c => c.id === campanaActiva)
  const cerrada = camp?.estado === 'cerrada'

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filtered = useMemo(() => {
    return data.filter(d => {
      const est = getEstado(d)
      const noav = d.var === 0
      if (filtro === 'green' && est !== 'green') return false
      if (filtro === 'amber' && est !== 'amber') return false
      if (filtro === 'red'   && est !== 'red')   return false
      if (filtro === 'noav'  && !noav)           return false
      if (filtro === 'pend'  && copied[d.cod_sede]) return false
      if (filtro === 'sent'  && !copied[d.cod_sede]) return false
      if (busq && !d.sede.toLowerCase().includes(busq.toLowerCase())) return false
      return true
    }).sort((a, b) => {
      if (a.total === 0 && b.total > 0) return 1
      if (b.total === 0 && a.total > 0) return -1
      return b.pct - a.pct
    })
  }, [data, filtro, busq, copied])

  const handleCopiar = async (d) => {
    const html = generarEmail(d, camp?.nombre || '')
    await copiarHTML(html)
    onCopied(d.cod_sede)
    showToast(`✓ Email de ${d.sede} copiado`)
  }

  const handleCopiarGrupo = async (grupo) => {
    const items = filtered.filter(d => getEstado(d) === grupo && !copied[d.cod_sede])
    if (!items.length) { showToast('No hay pendientes en este grupo'); return }
    const html = items.map(d => generarEmail(d, camp?.nombre || '')).join('<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb">')
    await copiarHTML(html)
    onCopiedAll(items.map(d => d.cod_sede))
    showToast(`✓ ${items.length} emails copiados`)
  }

  const handleCopiarTodos = async () => {
    const pend = filtered.filter(d => !copied[d.cod_sede])
    if (!pend.length) { showToast('Todos ya copiados'); return }
    const html = pend.map(d => generarEmail(d, camp?.nombre || '')).join('<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb">')
    await copiarHTML(html)
    onCopiedAll(pend.map(d => d.cod_sede))
    showToast(`✓ ${pend.length} emails copiados`)
  }

  const grupos = {
    green: filtered.filter(d => getEstado(d) === 'green'),
    amber: filtered.filter(d => getEstado(d) === 'amber'),
    red:   filtered.filter(d => getEstado(d) === 'red'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', padding: '10px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999,
          animation: 'fadeUp 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <input
          type="text" value={busq} onChange={e => setBusq(e.target.value)}
          placeholder="Buscar sede…"
          style={{
            padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 13, outline: 'none', width: 180, color: '#0f172a',
          }}
        />
        <select
          value={filtro} onChange={e => setFiltro(e.target.value)}
          style={{
            padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
          }}
        >
          <option value="">Todas las sedes</option>
          <option value="green">✅ En objetivo (≥50%)</option>
          <option value="amber">⚠️ En progreso</option>
          <option value="red">❌ Sin ingresos</option>
          <option value="noav">🟠 Sin avance</option>
          <option value="pend">📋 Pendientes</option>
          <option value="sent">✔ Enviadas</option>
        </select>

        <div style={{ flex: 1 }} />

        {!cerrada && (
          <button onClick={handleCopiarTodos} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer',
          }}>
            📋 Copiar pendientes
          </button>
        )}
      </div>

      {/* Grupos */}
      {Object.entries(grupos).map(([key, items]) => {
        if (!items.length) return null
        const e = ESTADOS[key]
        return (
          <div key={key} className="animate-fadeUp">
            {/* Header de grupo */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', marginBottom: 8,
              borderLeft: `3px solid ${e.color}`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {e.label} · {items.length} sedes
              </span>
              {!cerrada && (
                <button
                  onClick={() => handleCopiarGrupo(key)}
                  style={{
                    marginLeft: 'auto', padding: '4px 12px', borderRadius: 6,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${e.color}44`, background: e.bg, color: e.color,
                  }}
                >
                  Copiar grupo
                </button>
              )}
            </div>

            {/* Tabla */}
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '30%' }}>Sede</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Obj.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actual</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Var.</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '25%' }}>Cumplimiento</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                    {!cerrada && <th style={{ padding: '10px 16px', width: 100 }} />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => {
                    const est = getEstado(d)
                    const isCopied = copied[d.cod_sede]
                    const varColor = d.var > 0 ? '#059669' : d.var < 0 ? '#e11d48' : '#94a3b8'
                    const varTxt = d.var === null ? '—' : d.var > 0 ? `+${d.var}` : String(d.var)
                    return (
                      <tr
                        key={d.cod_sede}
                        style={{
                          borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: isCopied ? '#f0fdf4' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{d.sede}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{d.email}</div>
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>{d.objetivo}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{d.total}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: varColor }}>{varTxt}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <ProgressBar pct={d.pct} estado={est} />
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                          <Badge estado={est} />
                        </td>
                        {!cerrada && (
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleCopiar(d)}
                              style={{
                                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', border: isCopied ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
                                background: isCopied ? '#ecfdf5' : '#fff',
                                color: isCopied ? '#059669' : '#64748b',
                                transition: 'all 0.15s',
                              }}
                            >
                              {isCopied ? '✓ Copiado' : 'Copiar'}
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {!filtered.length && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>
          No hay sedes que coincidan con los filtros
        </div>
      )}
    </div>
  )
}
