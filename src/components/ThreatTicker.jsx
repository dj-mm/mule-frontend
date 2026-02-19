import { useState, useEffect } from 'react'

const ALERTS = [
  'ALERT: Circular transfer pattern detected in node cluster 7F-44',
  'WARNING: High-velocity micro-transactions flagged — Account ACC-3812',
  'SYSTEM: Graph neural network model updated — v4.2.1',
  'THREAT: Smurfing pattern active across 3 linked accounts',
  'INFO: Real-time transaction monitoring active — 0ms latency',
  'ALERT: Suspicious layering detected — Ring ID FR-007',
  'WARNING: Unusual offshore routing detected — Amount: $847,200',
  'SYSTEM: ML anomaly score threshold exceeded for 2 accounts',
]

export default function ThreatTicker() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ALERTS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ background: 'rgba(255,23,68,0.06)', borderBottom: '1px solid rgba(255,23,68,0.12)' }}
      className="relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="threat-dot" style={{ width: 6, height: 6 }} />
          <span className="font-mono text-xs text-red-500 uppercase tracking-widest">LIVE</span>
        </div>
        <div className="h-3 w-px bg-red-900/60" />
        <div className="flex-1 overflow-hidden">
          <div key={idx} className="font-mono text-xs text-red-400/70 anim-in" style={{ animationDuration: '0.4s' }}>
            {ALERTS[idx]}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-xs text-red-900">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </div>
  )
}
