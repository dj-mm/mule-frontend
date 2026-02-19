import { useState, useEffect } from 'react'

const STEPS = [
  'Parsing transaction CSV...',
  'Building graph topology...',
  'Running PageRank algorithm...',
  'Detecting fraud ring clusters...',
  'Scoring suspicious nodes...',
  'Generating threat report...',
]

export default function LoadingOverlay() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1))
      setProgress(p => Math.min(p + Math.random() * 20 + 8, 95))
    }, 380)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,2,10,0.92)', backdropFilter: 'blur(12px)' }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,23,68,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full px-8">
        {/* Spinner */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <svg className="absolute inset-0" style={{ animation: 'spinAnim 1.2s linear infinite' }} viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,23,68,0.1)" strokeWidth="2" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="#FF1744" strokeWidth="2"
              strokeLinecap="round" strokeDasharray="70 206" />
          </svg>
          {/* Inner ring */}
          <svg className="absolute inset-0" style={{ animation: 'spinAnim 2s linear infinite reverse' }} viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="32" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="1.5" />
            <circle cx="48" cy="48" r="32" fill="none" stroke="#00E5FF" strokeWidth="1.5"
              strokeLinecap="round" strokeDasharray="30 170" />
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

        <div className="text-center w-full">
          <div className="font-display text-3xl text-white mb-1" style={{ letterSpacing: '0.08em' }}>
            ANALYZING
          </div>
          <div className="font-mono text-xs mb-6" style={{ color: '#3D4560' }}>
            Financial Crime Detection Engine
          </div>

          {/* Progress bar */}
          <div className="w-full mb-4">
            <div className="flex justify-between font-mono text-xs mb-2" style={{ color: '#3D4560' }}>
              <span>{STEPS[step]}</span>
              <span style={{ color: '#FF4569' }}>{Math.floor(progress)}%</span>
            </div>
            <div className="progress-track" style={{ height: 3 }}>
              <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#FF1744,#FF4569)' }} />
            </div>
          </div>

          {/* Steps list */}
          <div className="text-left space-y-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 font-mono text-xs transition-all"
                style={{ color: i < step ? '#3D4560' : i === step ? '#F0F4FF' : '#1E2438' }}>
                <span style={{ color: i < step ? '#00E676' : i === step ? '#FF1744' : '#1E2438' }}>
                  {i < step ? '✓' : i === step ? '›' : '·'}
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
