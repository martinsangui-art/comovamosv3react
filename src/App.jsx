import { useState } from 'react'
import { useSheets } from './hooks/useSheets'
import Sidebar from './components/Sidebar'
import Dashboard from './views/Dashboard'
import Sedes from './views/Sedes'
import Historial from './views/Historial'
import Envio from './views/Envio'

function LoadingScreen({ error }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0B1730',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      {/* Logo */}
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-1px',
        boxShadow: '0 8px 32px rgba(200,16,46,0.4)',
      }}>
        U
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
          UCASAL · Cómo Vamos
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Dirección Operativa SEAD · Buenos Aires
        </div>
      </div>
      {error ? (
        <div style={{
          background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.3)',
          borderRadius: 10, padding: '12px 20px', maxWidth: 400, textAlign: 'center',
        }}>
          <div style={{ color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
            ❌ {error}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#C8102E',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Conectando con Google Sheets…
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function PageHeader({ title, sub, campana, fecha, sedes }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 20, borderBottom: '1px solid #e2e8f0', marginBottom: 24,
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {campana && (
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: '#ecfdf5', border: '1px solid #6ee7b7',
            fontSize: 12, fontWeight: 600, color: '#059669',
          }}>
            {campana}
          </div>
        )}
        {fecha && (
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            fontSize: 12, color: '#64748b',
          }}>
            Corte {fecha}
          </div>
        )}
        {sedes !== undefined && (
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: '#eef0f8', border: '1px solid #b8c0e0',
            fontSize: 12, fontWeight: 600, color: '#1B2A6B',
          }}>
            {sedes} sedes
          </div>
        )}
      </div>
    </div>
  )
}

const VIEW_META = {
  dashboard: { title: 'Dashboard',  sub: 'Visión general de la campaña activa' },
  sedes:     { title: 'Sedes',      sub: 'Estado individual y generación de emails' },
  historial: { title: 'Historial',  sub: 'Evolución semanal y comparación de sedes' },
  envio:     { title: 'Envío',      sub: 'Gestión de emails y registro de nuevas semanas' },
}

export default function App() {
  const [view, setView] = useState('dashboard')

  const {
    loading, error, campanas, sedes, campanaActiva, data, historial,
    copied, stats, cargarCampana, markCopied, markAllCopied, guardarSemana,
  } = useSheets()

  if (loading || error) return <LoadingScreen error={error} />

  const camp = campanas?.find(c => c.id === campanaActiva)
  const fecha = data[0]?.fecha || null
  const meta = VIEW_META[view]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar
        view={view}
        onView={setView}
        campanaActiva={campanaActiva}
        campanas={campanas}
        onCampana={cargarCampana}
      />

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px', overflowY: 'auto' }}>
        <PageHeader
          title={meta.title}
          sub={meta.sub}
          campana={camp?.nombre}
          fecha={fecha}
          sedes={view === 'dashboard' || view === 'sedes' ? data.length : undefined}
        />

        {view === 'dashboard' && (
          <Dashboard
            data={data} stats={stats} historial={historial}
            campanas={campanas} campanaActiva={campanaActiva}
            guardarSemana={guardarSemana}
          />
        )}
        {view === 'sedes' && (
          <Sedes data={data} campanas={campanas} campanaActiva={campanaActiva} />
        )}
        {view === 'historial' && (
          <Historial historial={historial} data={data} />
        )}
        {view === 'envio' && (
          <Envio
            data={data} copied={copied} onCopied={markCopied}
            campanas={campanas} campanaActiva={campanaActiva}
            guardarSemana={guardarSemana}
          />
        )}
      </main>
    </div>
  )
}
