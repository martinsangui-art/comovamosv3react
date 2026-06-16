import { useState, useMemo } from 'react'

function getEstado(d) {
  if (d.total === 0) return 'red'
  if (d.pct >= 50) return 'green'
  return 'amber'
}

const E = {
  green: { label: 'En objetivo',  color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  amber: { label: 'En progreso',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  red:   { label: 'Sin ingresos', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
}

function buildEmailHTML(d, campNombre) {
  const est = getEstado(d)
  const color = { green: '#059669', amber: '#d97706', red: '#e11d48' }[est]
  const noav = d.var === 0
  const varTxt = d.var !== null
    ? (d.var > 0 ? ` (+${d.var} vs semana anterior)` : d.var < 0 ? ` (${d.var} vs semana anterior)` : ' (sin variación)')
    : ''
  const extra = noav
    ? `<p style="margin-top:10px">Noté que esta semana no hubo nuevos ingresos registrados. Estoy a disposición para conectarnos y ver juntos cómo puedo acompañarte — a veces una charla corta ayuda a destrabar cosas. Avisáme cuando tengas un momento y coordinamos.</p>`
    : ''

  return `<p>${d.saludo}:</p>
<p style="margin-top:6px">Enviamos el resultado del <strong>cómo vamos</strong> al ${d.fecha}</p>
<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:12px">
  <tr style="background:#1a1a2e;color:#fff">
    <th style="padding:7px 10px;text-align:center;font-size:11px">COD SEDE</th>
    <th style="padding:7px 10px;text-align:center;font-size:11px">SEDE</th>
    <th style="padding:7px 10px;text-align:center;font-size:11px">OBJETIVO ${campNombre.toUpperCase()}</th>
    <th style="padding:7px 10px;text-align:center;font-size:11px">TOTAL ACUMULADO AL ${d.fecha}</th>
    <th style="padding:7px 10px;text-align:center;font-size:11px">% CUMPLIMIENTO</th>
  </tr>
  <tr>
    <td style="padding:7px 10px;text-align:center;border:1px solid #e5e7eb">${d.cod_sede}</td>
    <td style="padding:7px 10px;text-align:center;border:1px solid #e5e7eb">${d.sede}</td>
    <td style="padding:7px 10px;text-align:center;border:1px solid #e5e7eb">${d.objetivo}</td>
    <td style="padding:7px 10px;text-align:center;border:1px solid #e5e7eb">${d.total}${varTxt}</td>
    <td style="padding:7px 10px;text-align:center;border:1px solid #e5e7eb;color:${color};font-weight:700">${d.pct}%</td>
  </tr>
</table>${extra}
<p style="margin-top:10px">Feliz fin de semana.<br>Saludos!</p>`
}

async function copiarHTML(html) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })])
  } catch {
    const tmp = document.createElement('div')
    tmp.contentEditable = true
    tmp.style.cssText = 'position:fixed;left:-9999px;opacity:0'
    tmp.innerHTML = html
    document.body.appendChild(tmp)
    const sel = window.getSelection()
    sel.removeAllRanges()
    const r = document.createRange()
    r.selectNodeContents(tmp)
    sel.addRange(r)
    document.execCommand('copy')
    document.body.removeChild(tmp)
  }
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, background: '#0f172a', color: '#fff', fontSize: 11,
          padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 99,
          pointerEvents: 'none',
        }}>{text}</div>
      )}
    </div>
  )
}

function SedeRow({ d, copied, onCopy, campNombre, cerrada }) {
  const [open, setOpen] = useState(false)
  const est = getEstado(d)
  const e = E[est]
  const noav = d.var === 0
  const isCopied = copied[d.cod_sede]
  const varColor = d.var > 0 ? '#059669' : d.var < 0 ? '#e11d48' : '#94a3b8'
  const varTxt = d.var === null ? '—' : d.var > 0 ? `+${d.var}` : String(d.var)
  const preview = buildEmailHTML(d, campNombre)

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isCopied ? '#6ee7b7' : '#e2e8f0'}`,
      borderLeft: `4px solid ${isCopied ? '#059669' : e.color}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      {/* Header clickeable */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
          cursor: 'pointer', background: isCopied ? '#f0fdf4' : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9',
          padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        }}>{d.cod_sede}</span>

        <span style={{ fontWeight: 700, fontSize: 13, flex: 1, color: '#0f172a' }}>{d.sede}</span>

        {noav && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
            ⚠ Sin avance
          </span>
        )}
        {isCopied && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
            ✔ Copiada
          </span>
        )}

        <span style={{ fontSize: 11, fontWeight: 700, color: e.color, flexShrink: 0 }}>{d.pct}%</span>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Cuerpo expandible */}
      {open && (
        <div className="animate-fadeIn" style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Objetivo', d.objetivo, '#1B2A6B'],
              ['Ingresados', d.total, e.color],
              ['Faltan', Math.max(0, d.objetivo - d.total), '#64748b'],
              ['Var. semana', varTxt, varColor],
            ].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Barra de progreso */}
          <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{
              width: `${Math.min(100, d.pct)}%`, height: '100%',
              background: e.color, borderRadius: 3, transition: 'width 0.6s',
            }} />
          </div>

          {/* Alerta sin avance */}
          {noav && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b',
              borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#78350f', lineHeight: 1.5,
            }}>
              ⚠️ <strong>Sin avance respecto a la semana anterior.</strong> El email incluirá una invitación a reunión de seguimiento.
            </div>
          )}

          {/* Preview del email */}
          {!cerrada && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                padding: '7px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>Vista previa · tabla HTML lista para Gmail</span>
              </div>
              <div style={{ padding: '12px 16px', fontSize: 12.5, lineHeight: 1.7, color: '#222' }}
                dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          )}

          {/* Botón copiar */}
          {!cerrada && (
            <button
              onClick={async () => {
                await copiarHTML(preview)
                onCopy(d.cod_sede)
              }}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: isCopied
                  ? 'linear-gradient(135deg, #2d6a4f, #40916c)'
                  : 'linear-gradient(135deg, #1B2A6B, #2d4a9e)',
                color: '#fff',
              }}
            >
              {isCopied ? '✔ Copiado — clic para desmarcar' : '📋 Copiar para Gmail'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sedes({ data, copied, onCopied, onCopiedAll, campanas, campanaActiva }) {
  const [filtro, setFiltro] = useState('')
  const [busq, setBusq] = useState('')
  const [toast, setToast] = useState(null)

  const camp = campanas?.find(c => c.id === campanaActiva)
  const cerrada = camp?.estado === 'cerrada'

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const filtered = useMemo(() => {
    return data.filter(d => {
      const est = getEstado(d)
      if (filtro === 'green' && est !== 'green') return false
      if (filtro === 'amber' && est !== 'amber') return false
      if (filtro === 'red'   && est !== 'red')   return false
      if (filtro === 'noav'  && d.var !== 0)     return false
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

  const handleCopiarTodos = async () => {
    const pend = filtered.filter(d => !copied[d.cod_sede])
    if (!pend.length) { showToast('Todos ya copiados'); return }
    const all = pend.map(d => {
      const html = buildEmailHTML(d, camp?.nombre || '')
      return `<div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb">
        <p style="font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${d.sede}</p>
        ${html}</div>`
    }).join('')
    await copiarHTML(all)
    onCopiedAll(pend.map(d => d.cod_sede))
    showToast(`✅ ${pend.length} emails copiados`)
  }

  const grupos = {
    green: filtered.filter(d => getEstado(d) === 'green'),
    amber: filtered.filter(d => getEstado(d) === 'amber'),
    red:   filtered.filter(d => getEstado(d) === 'red'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#fff',
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 999, animation: 'fadeUp 0.2s ease',
        }}>{toast}</div>
      )}

      {/* Toolbar */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <input type="text" value={busq} onChange={e => setBusq(e.target.value)}
          placeholder="🔍 Buscar sede…"
          style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 190 }} />
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' }}>
          <option value="">Todas las sedes</option>
          <option value="green">✅ En objetivo (≥50%)</option>
          <option value="amber">⚠️ En progreso (1–49%)</option>
          <option value="red">❌ Sin ingresos</option>
          <option value="noav">🟠 Sin avance vs anterior</option>
          <option value="pend">📋 Pendientes de envío</option>
          <option value="sent">✔ Enviadas</option>
        </select>
        <div style={{ flex: 1 }} />
        {!cerrada && (
          <Tooltip text="Copia los emails de todas las sedes pendientes en una sola operación">
            <button onClick={handleCopiarTodos} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
              📋 Copiar selección ({filtered.filter(d => !copied[d.cod_sede]).length})
            </button>
          </Tooltip>
        )}
      </div>

      {/* Grupos */}
      {Object.entries(grupos).map(([key, items]) => {
        if (!items.length) return null
        const e = E[key]
        return (
          <div key={key}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px',
              marginBottom: 8, borderLeft: `3px solid ${e.color}`, paddingLeft: 12,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {e.label} · {items.length} sedes
              </span>
              {!cerrada && (
                <Tooltip text={`Copiar emails de todas las sedes "${e.label.toLowerCase()}" pendientes`}>
                  <button
                    onClick={async () => {
                      const pend = items.filter(d => !copied[d.cod_sede])
                      if (!pend.length) { showToast('No hay pendientes en este grupo'); return }
                      const all = pend.map(d => buildEmailHTML(d, camp?.nombre || '')).join('<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb">')
                      await copiarHTML(all)
                      onCopiedAll(pend.map(d => d.cod_sede))
                      showToast(`✅ ${pend.length} emails copiados`)
                    }}
                    style={{
                      marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: `1px solid ${e.color}44`, background: e.bg, color: e.color,
                    }}
                  >
                    Copiar grupo
                  </button>
                </Tooltip>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(d => (
                <SedeRow key={d.cod_sede} d={d} copied={copied}
                  onCopy={(cod) => {
                    if (copied[cod]) {
                      // desmarcar
                      const next = { ...copied }
                      delete next[cod]
                      onCopiedAll(Object.keys(next))
                    } else {
                      onCopied(cod)
                      showToast(`✅ Copiado: ${d.sede}`)
                    }
                  }}
                  campNombre={camp?.nombre || ''} cerrada={cerrada} />
              ))}
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
