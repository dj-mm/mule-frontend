import { useState } from 'react'

const PATTERN_STYLES = {
  smurfing:    { bg: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: 'rgba(139,92,246,0.2)' },
  layering:    { bg: 'rgba(0,229,255,0.07)', color: '#40C4FF', border: 'rgba(0,229,255,0.15)' },
  structuring: { bg: 'rgba(255,179,0,0.08)', color: '#FFD740', border: 'rgba(255,179,0,0.18)' },
  mule_chain:  { bg: 'rgba(255,23,68,0.08)', color: '#FF4569', border: 'rgba(255,23,68,0.2)' },
  round_trip:  { bg: 'rgba(0,230,118,0.07)', color: '#69F0AE', border: 'rgba(0,230,118,0.15)' },
  default:     { bg: 'rgba(255,255,255,0.04)', color: '#8892AA', border: 'rgba(255,255,255,0.07)' },
}

function getPatternStyle(type) {
  const key = Object.keys(PATTERN_STYLES).find(k => type?.toLowerCase().includes(k)) || 'default'
  return PATTERN_STYLES[key]
}

function RiskBar({ score }) {
  const n = Math.min(100, Math.max(0, Number(score)))
  const color = n > 80 ? '#FF4569' : n > 65 ? '#FF8F00' : n > 50 ? '#FFD740' : '#40C4FF'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 progress-track" style={{ minWidth: 60 }}>
        <div className="progress-fill" style={{ width: `${n}%`, background: color }} />
      </div>
      <span className="font-mono text-xs font-bold" style={{ color, minWidth: 30 }}>{score}</span>
    </div>
  )
}

export default function FraudRingTable({ rings, onRingSelect, highlightedAccounts = [] }) {
  const [sortKey, setSortKey] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')
  const [expanded, setExpanded] = useState(null)

  if (!rings?.length) {
    return (
      <div className="glass p-8 text-center">
        <p className="font-mono text-xs" style={{ color: '#3D4560' }}>No fraud rings detected.</p>
      </div>
    )
  }

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('desc') }
  }

  const sorted = [...rings].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const SortBtn = ({ col }) => (
    <span className="ml-1.5 font-mono" style={{ color: sortKey === col ? '#FF1744' : '#2A2F45' }}>
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const isRingActive = (members) =>
    members.length > 0 &&
    members.length === highlightedAccounts.length &&
    members.every(m => highlightedAccounts.includes(m))

  return (
    <div className="glass-danger">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <div className="font-heading text-base font-bold text-white tracking-wide uppercase">Detected Fraud Rings</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: '#3D4560' }}>
              {rings.length} criminal network{rings.length !== 1 ? 's' : ''} identified
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {highlightedAccounts.length > 0 && (
            <span className="font-mono text-xs px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,215,64,0.08)', border: '1px solid rgba(255,215,64,0.2)', color: '#FFD740' }}>
              ◈ Ring active on graph
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.15)' }}>
            <div className="threat-dot" style={{ width: 5, height: 5 }} />
            <span className="font-mono text-xs" style={{ color: '#FF4569' }}>ACTIVE THREAT</span>
          </div>
        </div>
      </div>

      {/* Click hint */}
      <div className="px-6 py-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3D4560" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span className="font-mono text-xs" style={{ color: '#3D4560' }}>
          Click any row to highlight that ring's nodes on the graph above
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('ring_id')}>Ring ID <SortBtn col="ring_id" /></th>
              <th onClick={() => handleSort('pattern_type')}>Pattern <SortBtn col="pattern_type" /></th>
              <th onClick={() => handleSort('member_count')}>Members <SortBtn col="member_count" /></th>
              <th onClick={() => handleSort('risk_score')}>Risk Score <SortBtn col="risk_score" /></th>
              <th>Member Accounts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ring, idx) => {
              const members = Array.isArray(ring.member_accounts)
                ? ring.member_accounts
                : (ring.member_accounts || '').split(',').map(s => s.trim()).filter(Boolean)
              const isExp = expanded === idx
              const display = isExp ? members : members.slice(0, 3)
              const ps = getPatternStyle(ring.pattern_type)
              const active = isRingActive(members)

              return (
                <tr
                  key={ring.ring_id ?? idx}
                  onClick={() => onRingSelect?.(members)}
                  style={{
                    cursor: 'pointer',
                    background: active
                      ? 'rgba(255,215,64,0.06)'
                      : 'transparent',
                    borderLeft: active ? '3px solid #FFD740' : '3px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,23,68,0.04)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      {active && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD740', boxShadow: '0 0 6px rgba(255,215,64,0.8)', flexShrink: 0 }} />
                      )}
                      <span className="font-mono text-xs px-2.5 py-1.5 rounded-lg"
                        style={{
                          background: active ? 'rgba(255,215,64,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${active ? 'rgba(255,215,64,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          color: active ? '#FFD740' : '#8892AA',
                        }}>
                        #{String(ring.ring_id ?? idx + 1).padStart(3, '0')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                      {ring.pattern_type}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-base font-bold text-white">{ring.member_count ?? members.length}</span>
                  </td>
                  <td className="min-w-32">
                    <RiskBar score={ring.risk_score} />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {display.map((m, i) => (
                        <span key={i} className="font-mono text-xs px-2 py-1 rounded-md"
                          style={{
                            background: active ? 'rgba(255,215,64,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${active ? 'rgba(255,215,64,0.2)' : 'rgba(255,255,255,0.06)'}`,
                            color: active ? '#FFD740' : '#6A7490',
                          }}>
                          {m}
                        </span>
                      ))}
                      {!isExp && members.length > 3 && (
                        <span className="font-mono text-xs px-2 py-1 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#3D4560' }}>
                          +{members.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {active ? (
                        <span className="font-mono text-xs" style={{ color: '#FFD740' }}>● Active</span>
                      ) : (
                        <span className="font-mono text-xs" style={{ color: '#2A2F45' }}>Click to highlight</span>
                      )}
                      {members.length > 3 && (
                        <button
                          onClick={e => { e.stopPropagation(); setExpanded(isExp ? null : idx) }}
                          className="font-mono text-xs transition-colors ml-1"
                          style={{ color: '#3D4560' }}
                          onMouseEnter={e => e.target.style.color = '#FF4569'}
                          onMouseLeave={e => e.target.style.color = '#3D4560'}>
                          {isExp ? '↑' : '↓'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <span className="font-mono text-xs" style={{ color: '#1E2438' }}>
          {sorted.length} ring{sorted.length !== 1 ? 's' : ''} · click headers to sort · click rows to highlight graph
        </span>
      </div>
    </div>
  )
}