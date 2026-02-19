import { useState } from 'react'

export default function DownloadButton({ data }) {
  const [done, setDone] = useState(false)

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `muletrace_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDone(true)
    setTimeout(() => setDone(false), 2500)
  }

  return (
    <button onClick={download}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all"
      style={{
        background: done ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${done ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.08)'}`,
        color: done ? '#00E676' : '#6A7490',
      }}>
      {done ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Exported
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export JSON
        </>
      )}
    </button>
  )
}
