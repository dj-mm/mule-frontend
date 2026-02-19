import { useEffect, useState } from 'react'

function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const n = parseFloat(String(target).replace(/[^0-9.]/g, ''))
    if (isNaN(n)) { setVal(target); return }
    let start = 0
    const step = n / 40
    const t = setInterval(() => {
      start += step
      if (start >= n) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 25)
    return () => clearInterval(t)
  }, [target])
  return <>{val}</>
}

export default function SummaryCards({ summary }) {
  if (!summary) return null

  const riskScore = summary.overall_risk_score ?? 0
  const riskColor = riskScore > 70 ? '#FF4569' : riskScore > 40 ? '#FFB300' : '#40C4FF'

  const cards = [
    {
      label: 'Total Accounts',
      value: summary.total_accounts ?? 0,
      suffix: '',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: '#40C4FF', glow: 'rgba(0,229,255,0.15)', sub: 'nodes analyzed', danger: false,
    },
    {
      label: 'Transactions',
      value: summary.total_transactions ?? 0,
      suffix: '',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      color: '#40C4FF', glow: 'rgba(0,229,255,0.12)', sub: 'edges in graph', danger: false,
    },
    {
      label: 'Flagged',
      value: summary.suspicious_count ?? 0,
      suffix: '',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      color: '#FF1744', glow: 'rgba(255,23,68,0.2)', sub: 'suspicious accounts', danger: true,
    },
    {
      label: 'Fraud Rings',
      value: summary.fraud_ring_count ?? 0,
      suffix: '',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      color: '#FF1744', glow: 'rgba(255,23,68,0.18)', sub: 'detected networks', danger: true,
    },
    {
      label: 'Risk Score',
      value: riskScore,
      suffix: '%',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      color: riskColor,
      glow: riskScore > 70 ? 'rgba(255,23,68,0.18)' : 'rgba(255,179,0,0.15)',
      sub: 'portfolio threat level',
      danger: riskScore > 70,
    },
    {
      label: 'Scan Time',
      value: summary.processing_time != null
        ? `${summary.processing_time.toFixed(1)}s`
        : '—',
      suffix: '',
      isString: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: '#00E676', glow: 'rgba(0,230,118,0.12)', sub: 'processing time', danger: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <div key={c.label} className={`stat-card anim-in d${i + 1} ${c.danger ? 'danger' : ''}`}>
          {/* Accent corner */}
          <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-5"
            style={{ background: c.color }} />

          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: c.glow, color: c.color, border: `1px solid ${c.glow}` }}>
            {c.icon}
          </div>

          <div className="font-mono text-2xl font-bold leading-none" style={{ color: c.color }}>
            {c.isString || typeof c.value === 'string'
              ? c.value
              : <><AnimatedNumber target={c.value} />{c.suffix}</>}
          </div>

          <div className="font-heading text-xs font-bold uppercase tracking-widest mt-2 mb-0.5"
            style={{ color: '#F0F4FF', opacity: 0.7 }}>
            {c.label}
          </div>
          <div className="font-mono text-xs" style={{ color: '#3D4560' }}>{c.sub}</div>

          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px rounded-b-2xl"
            style={{ background: `linear-gradient(90deg, transparent, ${c.color}40, transparent)` }} />
        </div>
      ))}
    </div>
  )
}