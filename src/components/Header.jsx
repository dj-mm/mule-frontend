import { useState, useEffect } from 'react'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="pt-10 pb-10">
      <div className="flex items-start justify-between gap-8">
        {/* LEFT: Branding */}
        <div className="anim-in">
          {/* Status pills */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.18)' }}>
              <div className="live-dot" />
              <span className="font-mono text-xs text-green-400 tracking-widest uppercase">Systems Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,23,68,0.07)', border: '1px solid rgba(255,23,68,0.18)' }}>
              <div className="threat-dot" style={{ width: 6, height: 6 }} />
              <span className="font-mono text-xs text-red-400 tracking-widest uppercase">Threat Detection Active</span>
            </div>
          </div>

          {/* Main title */}
          <div className="flex items-end gap-3 leading-none">
            <h1 className="font-display text-7xl md:text-8xl text-white"
              style={{ textShadow: '0 0 60px rgba(255,23,68,0.3)' }}>
              MULE
            </h1>
            <h1 className="font-display text-7xl md:text-8xl"
              style={{ color: '#FF1744', textShadow: '0 0 40px rgba(255,23,68,0.6), 0 0 80px rgba(255,23,68,0.3)' }}>
              TRACE
            </h1>
            <span className="font-mono text-xs text-red-900 mb-4 ml-1">v2.4</span>
          </div>

          <p className="mt-4 text-lg font-light max-w-xl leading-relaxed" style={{ color: '#6A7490' }}>
            Autonomous financial crime detection engine. Expose money mule networks,
            layering schemes, and fraud rings hidden inside transaction graphs.
          </p>

          {/* Tech tags */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {['Graph Neural Network', 'PageRank Analysis', 'Cytoscape.js', 'Real-time Detection'].map(tag => (
              <span key={tag} className="font-mono text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#4A5568' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT: System terminal readout */}
        <div className="hidden lg:flex flex-col gap-2 anim-in d2 flex-shrink-0">
          <div className="glass p-5 rounded-xl min-w-56"
            style={{ border: '1px solid rgba(255,23,68,0.15)', background: 'rgba(5,5,15,0.8)' }}>
            <div className="font-mono text-xs text-red-900 mb-3 uppercase tracking-widest">System Status</div>
            {[
              { label: 'Engine', value: 'ACTIVE', color: '#00E676' },
              { label: 'Model', value: 'GNN-v4.2', color: '#40C4FF' },
              { label: 'Accuracy', value: '97.3%', color: '#FFD740' },
              { label: 'Latency', value: '< 2ms', color: '#00E676' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs" style={{ color: '#3D4560' }}>{label}</span>
                <span className="font-mono text-xs font-medium" style={{ color }}>{value}</span>
              </div>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="font-mono text-xs" style={{ color: '#3D4560' }}>
                {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
              </div>
              <div className="font-mono text-sm text-white mt-0.5">
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider with hex decoration */}
      <div className="mt-10 flex items-center gap-4">
        <div style={{ width: 8, height: 8, background: '#FF1744', clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }} />
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,23,68,0.4), rgba(255,23,68,0.1), transparent)' }} />
        <span className="font-mono text-xs" style={{ color: '#3D4560' }}>MULETRACE_ENGINE_2.4.1</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05))' }} />
      </div>
    </header>
  )
}
