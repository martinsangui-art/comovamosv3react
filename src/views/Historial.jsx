import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#1B2A6B', '#C8102E', '#059669', '#d97706', '#7c3aed', '#0891b2']

export default function Historial({ historial, data }) {
  const [modo, setModo] = useState('tabla')       // tabla | grafico
  const [busq, setBusq] = useState('')
  const [sedesComp, setSedesComp] = useState([])  // hasta 5 sedes para comparar

  // Fechas únicas ordenadas
  const fechas = useMemo(() => {
    const set = new Set(historial.map(r => r.fecha))
    return [...set].sort()
  }, [historial])

  // Sedes únicas
  const todasSedes = useMemo(() => {
    const map = {}
    historial.forEach(r => { map[r.cod_sede] = r.sede })
    return Object.entries(map).sort(([,a],[,b]) => a.localeCompare(b))
  }, [historial])

  // Datos para gráfico de comparación
  const datosGrafico = useMemo(() => {
    if (!sedesComp.length) return []
    return fechas.map(fecha => {
      const row = { fecha: fecha.slice(5) }
      sedesComp.forEach(cod => {
        const entry = historial.find(r => r.fecha === fecha && String(r.cod_sede) === String(cod))
        row[cod] = entry ? Number(entry.pct_cumplimiento?.replace('%','')) || 
          (entry.objetivo > 0 ? Math.round(entry.total / entry.objetivo * 100) : 0) : null
      })
      return row
    })
  }, [sedesComp, fechas, historial])

  // Tabla última semana (de data, que ya viene procesada)
  const tablaFiltrada = useMemo(() => {
    if (!data.length) return []
    return data.filter(d => !busq || d.sede.toLowerCase().includes(busq.toLowerCase()))
      .sort((a, b) => b.pct - a.pct)
  }, [data, busq])

  const toggleSede = (cod) => {
    setSedesComp(prev =>
      prev.includes(cod) ? prev.filter(c => c !== cod) : prev.length < 5 ? [...prev, cod] : prev
    )
  }

  const sedeNombre = (cod) => todasSedes.find(([c]) => c === cod)?.[1] || cod

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tabs modo */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '4px', display: 'inline-flex', gap: 2,
      }}>
        {[['tabla', '📋 Semana actual'], ['grafico', '📈 Evolución']].map(([id, label]) => (
          <button
            key={id} onClick={() => setModo(id)}
            style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: modo === id ? '#1B2A6B' : 'transparent',
              color: modo === id ? '#fff' : '#64748b',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* MODO TABLA — semana actual */}
      {modo === 'tabla' && (
        <div className="animate-fadeIn">
          <div style={{ marginBottom: 12 }}>
            <input
              type="text" value={busq} onChange={e => setBusq(e.target.value)}
              placeholder="Buscar sede…"
              style={{
                padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 13, outline: 'none', width: 200, color: '#0f172a',
              }}
            />
          </div>

          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Sede', 'Objetivo', 'Ingresados', 'Faltan', 'Var.', 'Cumplimiento'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: h === 'Sede' ? 'left' : 'center',
                      fontSize: 11, fontWeight: 600, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tablaFiltrada.map((d, i) => {
                  const pct = d.pct || 0
                  const color = pct >= 50 ? '#059669' : pct > 0 ? '#d97706' : '#e11d48'
                  const varColor = d.var > 0 ? '#059669' : d.var < 0 ? '#e11d48' : '#94a3b8'
                  return (
                    <tr key={d.cod_sede} style={{ borderBottom: i < tablaFiltrada.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d.sede}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{d.objetivo}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d.total}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{Math.max(0, d.objetivo - d.total)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: varColor, fontVariantNumeric: 'tabular-nums' }}>
                        {d.var === null ? '—' : d.var > 0 ? `+${d.var}` : d.var}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODO GRÁFICO — evolución comparativa */}
      {modo === 'grafico' && (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selector de sedes */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Seleccioná hasta 5 sedes para comparar
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {todasSedes.map(([cod, nombre], i) => {
                const sel = sedesComp.includes(cod)
                const colorIdx = sedesComp.indexOf(cod)
                return (
                  <button
                    key={cod} onClick={() => toggleSede(cod)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: sel ? `2px solid ${COLORS[colorIdx]}` : '1px solid #e2e8f0',
                      background: sel ? COLORS[colorIdx] + '15' : '#fff',
                      color: sel ? COLORS[colorIdx] : '#64748b',
                    }}
                  >
                    {nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Gráfico */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px',
          }}>
            {sedesComp.length === 0 ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                Seleccioná al menos una sede para ver su evolución
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={datosGrafico} margin={{ top: 4, right: 24, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                    formatter={(v, name) => [v !== null ? v + '%' : '—', sedeNombre(name)]}
                  />
                  <Legend formatter={(value) => sedeNombre(value)} />
                  {sedesComp.map((cod, i) => (
                    <Line
                      key={cod} type="monotone" dataKey={cod}
                      stroke={COLORS[i]} strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS[i], strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
