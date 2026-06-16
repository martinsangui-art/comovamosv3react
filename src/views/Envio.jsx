import { useState } from 'react'

const WEBHOOK = 'https://hook.us2.make.com/3xhcn02owq56c196s0j3anawf5zesxht'

export default function Envio({ data, copied, onCopied, campanas, campanaActiva, guardarSemana }) {
  const [log, setLog] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10))
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const camp = campanas?.find(c => c.id === campanaActiva)
  const cerrada = camp?.estado === 'cerrada'

  const pendientes = data.filter(d => !copied[d.cod_sede])
  const enviadas   = data.filter(d => copied[d.cod_sede])

  const addLog = (msg, tipo = 'info') => {
    setLog(prev => [...prev, { msg, tipo, ts: new Date().toLocaleTimeString() }])
  }

  const enviarTodos = async () => {
    if (!pendientes.length) return
    setEnviando(true)
    setLog([])
    setProgreso(0)
    addLog(`Iniciando envío de ${pendientes.length} emails…`, 'info')

    for (let i = 0; i < pendientes.length; i++) {
      const d = pendientes[i]
      try {
        await fetch(WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sede: d.sede, email: d.email, saludo: d.saludo,
            total: d.total, objetivo: d.objetivo, pct: d.pct,
            var: d.var, fecha: d.fecha, campana: camp?.nombre || '',
          }),
        })
        onCopied(d.cod_sede)
        addLog(`✓ ${d.sede}`, 'ok')
      } catch {
        addLog(`✕ Error en ${d.sede}`, 'error')
      }
      setProgreso(Math.round((i + 1) / pendientes.length * 100))
    }

    addLog(`Listo. ${pendientes.length} emails procesados.`, 'ok')
    setEnviando(false)
  }

  const handleGuardar = async () => {
    if (!nuevaFecha) return
    setGuardando(true)
    try {
      const sedes = data.map(d => ({
        cod: d.cod_sede,
        sede: d.sede,
        total: Number(valores[d.cod_sede] ?? d.total) || 0,
      }))
      await guardarSemana(nuevaFecha, sedes)
      setMostrarNueva(false)
      setValores({})
      addLog(`✓ Semana del ${nuevaFecha} guardada en Sheets`, 'ok')
    } catch (e) {
      addLog(`✕ Error: ${e.message}`, 'error')
    }
    setGuardando(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats de envío */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total sedes', value: data.length, color: '#1B2A6B' },
          { label: 'Enviadas', value: enviadas.length, color: '#059669' },
          { label: 'Pendientes', value: pendientes.length, color: pendientes.length > 0 ? '#d97706' : '#94a3b8' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Panel de envío */}
      {!cerrada && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #C8102E, #9b0d23)',
            padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Envío semanal</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
                Desde mcrossi@ucasal.edu.ar vía Make
              </div>
            </div>
            {pendientes.length > 0 && !enviando && (
              <button onClick={enviarTodos} style={{
                padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: '#fff', color: '#C8102E', border: 'none', cursor: 'pointer',
              }}>
                🚀 Enviar {pendientes.length} emails
              </button>
            )}
            {enviando && (
              <div style={{ color: '#fff', fontSize: 13 }}>Enviando… {progreso}%</div>
            )}
            {!pendientes.length && !enviando && log.length > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>✓ Todos enviados</div>
            )}
          </div>

          {/* Barra de progreso */}
          {enviando && (
            <div style={{ height: 4, background: '#f1f5f9' }}>
              <div style={{
                width: `${progreso}%`, height: '100%',
                background: 'linear-gradient(90deg, #C8102E, #f43f5e)',
                transition: 'width 0.3s',
              }} />
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div style={{ padding: '16px 24px' }}>
              <div style={{
                background: '#0f172a', borderRadius: 10, padding: '12px 16px',
                height: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12,
              }}>
                {log.map((l, i) => (
                  <div key={i} style={{
                    color: l.tipo === 'ok' ? '#4ade80' : l.tipo === 'error' ? '#f87171' : '#94a3b8',
                    lineHeight: 1.8,
                  }}>
                    <span style={{ color: '#475569', marginRight: 8 }}>{l.ts}</span>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de pendientes */}
          {pendientes.length > 0 && !enviando && (
            <div style={{ padding: '0 24px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pendientes de envío
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                {pendientes.map(d => (
                  <div key={d.cod_sede} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 12px', background: '#f8fafc', borderRadius: 8,
                    fontSize: 13,
                  }}>
                    <span style={{ fontWeight: 500 }}>{d.sede}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{d.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nueva semana */}
      {!cerrada && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          <button
            onClick={() => setMostrarNueva(v => !v)}
            style={{
              width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0f172a',
            }}
          >
            <span>📅 Registrar nueva semana</span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{mostrarNueva ? '▲ Cerrar' : '▼ Abrir'}</span>
          </button>

          {mostrarNueva && (
            <div className="animate-fadeIn" style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Fecha del corte:</label>
                <input
                  type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)}
                  style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                />
                <button
                  onClick={() => {
                    const prev = {}
                    data.forEach(d => { prev[d.cod_sede] = d.total })
                    setValores(prev)
                  }}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer',
                  }}
                >
                  Copiar valores actuales
                </button>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8, marginBottom: 16, maxHeight: 360, overflowY: 'auto',
              }}>
                {data.map(d => (
                  <div key={d.cod_sede} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: '#f8fafc', borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.sede}
                    </span>
                    <input
                      type="number" min="0"
                      value={valores[d.cod_sede] ?? d.total}
                      onChange={e => setValores(prev => ({ ...prev, [d.cod_sede]: e.target.value }))}
                      style={{
                        width: 60, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 6,
                        fontSize: 13, fontWeight: 700, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleGuardar} disabled={guardando}
                  style={{
                    padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#1B2A6B', color: '#fff', border: 'none', cursor: 'pointer',
                    opacity: guardando ? 0.6 : 1,
                  }}
                >
                  {guardando ? 'Guardando…' : '💾 Guardar en Sheets'}
                </button>
                <button
                  onClick={() => setMostrarNueva(false)}
                  style={{
                    padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
