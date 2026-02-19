import { useState } from 'react'

function getScoreClass(n) {
  if (n > 80) return 'badge-critical'
  if (n > 65) return 'badge-high'
  if (n > 50) return 'badge-medium'
  return 'badge-low'
}

function getScoreColor(n) {
  if (n > 80) return '#FF4569'
  if (n > 65) return '#FF8F00'
  if (n > 50) return '#FFD740'
  return '#40C4FF'
}

export default function SuspiciousAccountsPanel({ accounts }) {
  const [selected, setSelected] = useState(null)

  if (!accounts?.length) {
    return (
      <div className="glass flex items-center justify-center" style={{ height: 600 }}>
        <p className="font-mono text-xs" style={{ color: '#3D4560' }}>No suspicious accounts detected.</p>
      </div>
    )
  }

  const top10 = [...accounts]
    .sort((a, b) => Number(b.suspicion_score) - Number(a.suspicion_score))
    .slice(0, 10)

  const sel = selected !== null ? top10[selected] : null

  return (
    <div className="glass-danger flex flex-col" style={{ height: 600 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div className="font-heading text-base font-bold text-white tracking-wide uppercase">Threat Actors</div>
          <div className="font-mono text-xs mt-0.5" style={{ color: '#3D4560' }}>Top {top10.length} · sorted by risk</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,23,68,0.07)', border: '1px solid rgba(255,23,68,0.15)' }}>
          <div className="threat-dot" style={{ width: 5, height: 5 }} />
          <span className="font-mono text-xs" style={{ color: '#FF4569' }}>ACTIVE</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {top10.map((acc, idx) => {
          const score = Number(acc.suspicion_score)
          const color = getScoreColor(score)
          const isActive = selected === idx
          const patterns = Array.isArray(acc.detected_patterns)
            ? acc.detected_patterns
            : acc.detected_patterns ? [acc.detected_patterns] : []

          return (
            <div key={acc.account_id ?? idx}>
              {/* Row */}
              <div
                onClick={() => setSelected(isActive ? null : idx)}
                className="account-row flex items-center gap-3"
                style={isActive ? {
                  background: 'rgba(255,23,68,0.05)',
                  borderLeft: '2px solid #FF1744',
                  paddingLeft: 18,
                } : {}}
              >
                {/* Rank */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs flex-shrink-0"
                  style={{
                    background: idx < 3 ? 'rgba(255,23,68,0.1)' : 'rgba(255,255,255,0.03)',
                    color: idx < 3 ? '#FF4569' : '#3D4560',
                    border: `1px solid ${idx < 3 ? 'rgba(255,23,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white truncate">{acc.account_id}</div>
                  {acc.name && <div className="text-xs truncate" style={{ color: '#3D4560' }}>{acc.name}</div>}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${getScoreClass(score)}`}>{score}%</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3D4560" strokeWidth="2"
                    style={{ transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Expanded */}
              {isActive && (
                <div className="px-5 pb-4 pt-2" style={{ background: 'rgba(255,23,68,0.03)' }}>
                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between font-mono text-xs mb-1.5" style={{ color: '#3D4560' }}>
                      <span>Threat Score</span><span style={{ color }}>{score}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                    </div>
                  </div>

                  {/* Patterns */}
                  {patterns.length > 0 && (
                    <div className="mb-3">
                      <div className="font-mono text-xs mb-1.5" style={{ color: '#3D4560' }}>Detected Patterns</div>
                      <div className="flex flex-wrap gap-1.5">
                        {patterns.map((p, i) => <span key={i} className="pattern-tag">{p}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: 'Sent', v: acc.total_sent, prefix: '$' },
                      { l: 'Received', v: acc.total_received, prefix: '$' },
                      { l: 'Txns', v: acc.transaction_count, prefix: '' },
                    ].filter(x => x.v != null).map(({ l, v, prefix }) => (
                      <div key={l} className="rounded-lg p-2.5"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="font-mono text-xs" style={{ color: '#3D4560' }}>{l}</div>
                        <div className="font-mono text-sm font-medium mt-0.5 text-white">
                          {prefix}{typeof v === 'number' ? Number(v).toLocaleString() : v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="font-mono text-xs" style={{ color: '#1E2438' }}>Click row to expand details</span>
      </div>
    </div>
  )
}
