import { useMemo, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

// ── Arco semicircular animado ────────────────────────────────────────────────
function ArcGauge({ pct }) {
  const ref = useRef(null)
  const color = pct >= 50 ? '#059669' : pct > 0 ? '#d97706' : '#e11d48'
  const r = 72, cx = 100, cy = 100
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const filled = (Math.min(pct, 110) / 100) * arc

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'none'
    el.style.strokeDasharray = `0 ${circ}`
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)'
      el.style.strokeDasharray = `${filled} ${circ}`
    })
  }, [pct])

  return (
    <svg viewBox="0 0 200 160" width="200" height="160" style={{ overflow: 'visible' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="12"
        strokeDasharray={`${arc} ${circ}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round" />
      {/* Fill */}
      <circle ref={ref} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round" />
      {/* Valor */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color}
        style={{ fontSize: 38, fontWeight: 800, fontFamily: 'Inter', fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#94a3b8"
        style={{ fontSize: 11, fontFamily: 'Inter' }}>
        cumplimiento global
      </text>
    </svg>
  )
}

// ── Gráfico de barras horizontal SVG (igual al original) ─────────────────────
function BarChart({ data }) {
  if (!data.length) return null
  const sorted = [...data].sort((a, b) => b.pct - a.pct)
  const BAR_H = 26, GAP = 5, LBL_W = 170, BAR_MAX = 400, PCT_W = 120
  const SVG_W = LBL_W + BAR_MAX + PCT_W + 16
  const SVG_H = (BAR_H + GAP) * sorted.length + 8

  const bars = sorted.map((d, i) => {
    const y = 4 + i * (BAR_H + GAP)
    const pct = d.pct
    const fill = pct >= 50 ? '#52b788' : d.total > 0 ? '#f59e0b' : '#f43f5e'
    const bW = Math.max(2, Math.round((pct / 100) * BAR_MAX))
    let lbl = d.sede.replace(/ - BUENOS AIRES$/, '').replace(/ - BS AS$/, '').replace(/ - BUENOS AIRES Modo 7$/, '')
    if (lbl.length > 22) lbl = lbl.slice(0, 21) + '…'
    return (
      <g key={d.cod_sede}>
        <rect x={LBL_W} y={y} width={BAR_MAX} height={BAR_H} rx={3} fill="#f1f5f9" />
        <rect x={LBL_W} y={y} width={bW} height={BAR_H} rx={3} fill={fill} />
        <text x={LBL_W - 6} y={y + BAR_H / 2 + 4} textAnchor="end"
          style={{ fontSize: 10, fontFamily: 'Inter', fill: '#4b5563' }}>{lbl}</text>
        <text x={LBL_W + bW + 6} y={y + BAR_H / 2 + 4}
          style={{ fontSize: 11, fontFamily: 'Inter', fontWeight: 700, fill }}>{pct}% ({d.total}/{d.objetivo})</text>
      </g>
    )
  })

  const x50 = LBL_W + Math.round(0.5 * BAR_MAX)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', minWidth: 500 }}>
        {bars}
        <line x1={x50} y1={0} x2={x50} y2={SVG_H} stroke="#C8102E" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
        <text x={x50} y={SVG_H + 12} textAnchor="middle" style={{ fontSize: 9, fill: '#C8102E' }}>50%</text>
      </svg>
    </div>
  )
}

// ── Stat card con borde superior de color ─────────────────────────────────────
function StatCard({ label, value, color, delay = 0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay: `${delay}ms`,
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: '16px 20px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

export default function Dashboard({ data, stats, historial, campanas, campanaActiva }) {
  const camp = campanas?.find(c => c.id === campanaActiva)
  const cerrada = camp?.estado === 'cerrada'

  // Evolución global
  const evolucion = useMemo(() => {
    if (!historial.length) return []
    const byFecha = {}
    historial.forEach(r => {
      const f = r.fecha
      if (!byFecha[f]) byFecha[f] = { total: 0, obj: 0 }
      byFecha[f].total += Number(r.total) || 0
      byFecha[f].obj   += Number(r.objetivo) || 0
    })
    return Object.entries(byFecha).sort(([a],[b]) => a.localeCompare(b)).map(([fecha, v]) => ({
      fecha: fecha.slice(5),
      pct: v.obj > 0 ? Math.round(v.total / v.obj * 100) : 0,
    }))
  }, [historial])

  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8', fontSize: 14 }}>
      Sin datos para esta campaña
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Banner campaña cerrada */}
      {cerrada && (
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #6b7280',
          borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#64748b',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          🔒 <span><strong>{camp?.nombre}</strong> está cerrada — resultado final: <strong style={{ color: stats.pctGlobal >= 50 ? '#059669' : '#d97706' }}>{stats.pctGlobal}%</strong></span>
        </div>
      )}

      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Arco */}
        <div className="animate-fadeUp" style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <ArcGauge pct={stats.pctGlobal} />
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{stats.totalIng} de {stats.totalObj} inscriptos</div>
          {data[0]?.fecha && <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', marginTop: 2 }}>Corte {data[0].fecha}</div>}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatCard label="En objetivo ≥50%" value={stats.enObj} color="#059669" delay={60} />
          <StatCard label="En progreso" value={stats.enProg} color="#d97706" delay={100} />
          <StatCard label="Sin ingresos" value={stats.sinIng} color="#e11d48" delay={140} />
          <StatCard label="Sin avance" value={stats.sinAv || '—'} color="#7c3aed" delay={180} />
        </div>
      </div>

      {/* Evolución */}
      <div className="animate-fadeUp" style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '20px 24px', animationDelay: '100ms',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Evolución semanal</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Cumplimiento global acumulado por corte</div>
          </div>
          {evolucion.length > 0 && (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {evolucion.length} corte{evolucion.length !== 1 ? 's' : ''} registrado{evolucion.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        {evolucion.length >= 2 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={evolucion} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradNav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B2A6B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B2A6B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                formatter={v => [v + '%', 'Cumplimiento']} />
              <Area type="monotone" dataKey="pct" stroke="#1B2A6B" strokeWidth={2.5}
                fill="url(#gradNav)" dot={{ r: 3, fill: '#1B2A6B', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#C8102E', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>
            Necesitás al menos 2 cortes para ver la evolución
          </div>
        )}
      </div>

      {/* Gráfico de barras por sede */}
      <div className="animate-fadeUp" style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: '20px 24px', animationDelay: '150ms',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Cumplimiento por sede</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Ordenado de mayor a menor · línea roja = 50%</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[['#52b788','≥ 50%'],['#f59e0b','En progreso'],['#f43f5e','Sin ingresos']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                {l}
              </div>
            ))}
          </div>
        </div>
        <BarChart data={data} />
      </div>

    </div>
  )
}
