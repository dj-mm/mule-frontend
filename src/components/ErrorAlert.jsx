export default function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl relative overflow-hidden"
      style={{ background: 'rgba(255,23,68,0.05)', border: '1px solid rgba(255,23,68,0.2)', boxShadow: '0 0 40px rgba(255,23,68,0.08)' }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,23,68,0.5),transparent)' }} />

      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div className="flex-1">
        <div className="font-heading text-sm font-bold tracking-wide uppercase" style={{ color: '#FF4569' }}>Detection Engine Error</div>
        <div className="font-mono text-xs mt-1 leading-relaxed" style={{ color: '#6A7490' }}>{message}</div>
      </div>

      <button onClick={onDismiss} className="transition-colors flex-shrink-0"
        style={{ color: '#3D4560' }}
        onMouseEnter={e => e.currentTarget.style.color = '#FF4569'}
        onMouseLeave={e => e.currentTarget.style.color = '#3D4560'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
