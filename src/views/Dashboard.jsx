import { useMemo } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function getColor(pct) {
  if (pct === 0) return { text: '#e11d48', bg: '#fff1f2', border: '#fecdd3' }
  if (pct >= 50) return { text: '#059669', bg: '#ecfdf5', border: '#6ee7b7' }
  return { text: '#d97706', bg: '#fffbeb', border: '#fde68a' }
}

function ArcProgress({ pct }) {
  const r = 80
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ * 0.75
  const color = pct >= 50 ? '#059669' : pct > 0 ? '#d97706' : '#e11d48'

  return (
    <svg width="200" height="160" viewBox="0 0 200 160" style={{ overflow: 'visible' }}>
      <circle cx="100" cy="120" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round" />
      <circle cx="100" cy="120" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
      <text x="100" y="110" textAnchor="middle" fill={color}
        style={{ fontSize: 42, fontWeight: 700, fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </text>
      <text x="100" y="132" textAnchor="middle" fill="#94a3b8"
        style={{ fontSize: 12, fontFamily: 'Inter' }}>
        cumplimiento global
      </text>
    </svg>
  )
}

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div
      className="animate-fadeUp"
      style={{
        animationDelay: `${delay}ms`,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 24px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function AlertCard({ sede, tipo, value, delay = 0 }) {
  const configs = {
    retroceso: { icon: '↓', color: '#e11d48', bg: '#fff1f2', label: 'retrocedió' },
    cero:      { icon: '✕', color: '#94a3b8', bg: '#f8fafc', label: 'sin ingresos' },
    superado:  { icon: '↑', color: '#059669', bg: '#ecfdf5', label: 'superó objetivo' },
  }
  const c = configs[tipo]
  return (
    <div
      className="animate-fadeUp flex items-center gap-3"
      style={{
        animationDelay: `${delay}ms`,
        background: c.bg,
        border: `1px solid ${c.color}22`,
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <span style={{ fontSize: 16, color: c.color, fontWeight: 700, width: 20, textAlign: 'center' }}>{c.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', truncate: true }}>{sede}</div>
        <div style={{ fontSize: 11, color: c.color }}>{c.label} {value ? `· ${value}` : ''}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ data, stats, historial, campanas, campanaActiva }) {
  const camp = campanas?.find(c => c.id === campanaActiva)
  const cerrada = camp?.estado === 'cerrada'

  // Alertas
  const alertas = useMemo(() => {
    const ret = data.filter(d => d.var !== null && d.var < 0).slice(0, 4)
    const cer = data.filter(d => d.total === 0).slice(0, 4)
    const sup = data.filter(d => d.pct >= 100).slice(0, 3)
    return { ret, cer, sup }
  }, [data])

  // Evolución histórica global (promedio semanal)
  const evolucion = useMemo(() => {
    if (!historial.length) return []
    const byFecha = {}
    historial.forEach(r => {
      if (!byFecha[r.fecha]) byFecha[r.fecha] = { total: 0, obj: 0 }
      byFecha[r.fecha].total += Number(r.total) || 0
      byFecha[r.fecha].obj   += Number(r.objetivo) || 0
    })
    return Object.entries(byFecha).sort(([a],[b]) => a.localeCompare(b)).map(([fecha, v]) => ({
      fecha: fecha.slice(5),
      pct: v.obj > 0 ? Math.round(v.total / v.obj * 100) : 0,
    }))
  }, [historial])

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Sin datos para esta campaña</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Campaña cerrada banner */}
      {cerrada && (
        <div className="animate-fadeUp" style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            <strong>{camp?.nombre}</strong> está cerrada — datos de solo lectura.
            Resultado final: <strong style={{ color: stats.pctGlobal >= 50 ? '#059669' : '#d97706' }}>{stats.pctGlobal}%</strong>
          </span>
        </div>
      )}

      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Arco central */}
        <div className="animate-fadeUp" style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
          padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <ArcProgress pct={stats.pctGlobal} />
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            {stats.totalIng} de {stats.totalObj} inscriptos
          </div>
          {data[0]?.fecha && (
            <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center' }}>
              Corte {data[0].fecha}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatCard label="En objetivo" value={stats.enObj} sub="sedes ≥ 50%" color="#059669" delay={50} />
          <StatCard label="En progreso" value={stats.enProg} sub="sedes 1–49%" color="#d97706" delay={100} />
          <StatCard label="Sin ingresos" value={stats.sinIng} sub="sedes en cero" color="#e11d48" delay={150} />
          <StatCard label="Sin avance" value={stats.sinAv} sub="vs semana anterior" color="#7c3aed" delay={200} />
        </div>
      </div>

      {/* Evolución + Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

        {/* Gráfico evolución */}
        <div className="animate-fadeUp" style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px',
          animationDelay: '100ms',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            Evolución semanal
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>
            Cumplimiento global promedio por corte
          </div>
          {evolucion.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={evolucion} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
                  formatter={v => [v + '%', 'Cumplimiento']}
                  labelStyle={{ color: '#64748b', fontSize: 11 }}
                />
                <Line
                  type="monotone" dataKey="pct" stroke="#1B2A6B" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1B2A6B', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#C8102E', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>
              Necesitás al menos 2 cortes para ver la evolución
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="animate-fadeUp" style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px',
          animationDelay: '150ms',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
            Atención inmediata
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertas.sup.map((d, i) => (
              <AlertCard key={d.cod_sede} sede={d.sede} tipo="superado" value={`${d.pct}%`} delay={i * 40} />
            ))}
            {alertas.ret.map((d, i) => (
              <AlertCard key={d.cod_sede} sede={d.sede} tipo="retroceso" value={`${d.var > 0 ? '+' : ''}${d.var}`} delay={i * 40} />
            ))}
            {alertas.cer.map((d, i) => (
              <AlertCard key={d.cod_sede} sede={d.sede} tipo="cero" delay={i * 40} />
            ))}
            {!alertas.sup.length && !alertas.ret.length && !alertas.cer.length && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Sin alertas esta semana ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
