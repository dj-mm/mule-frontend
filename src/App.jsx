import { useState, useRef } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import SummaryCards from './components/SummaryCards'
import GraphVisualization from './components/GraphVisualization'
import FraudRingTable from './components/FraudRingTable'
import SuspiciousAccountsPanel from './components/SuspiciousAccountsPanel'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorAlert from './components/ErrorAlert'
import DownloadButton from './components/DownloadButton'
import ThreatTicker from './components/ThreatTicker'

export default function App() {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [highlightedAccounts, setHighlightedAccounts] = useState([])

  const handleUploadSuccess = (data) => {
    setAnalysisData(data)
    setError(null)
    setHighlightedAccounts([])
    setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 120)
  }

  const handleReset = () => {
    setAnalysisData(null)
    setError(null)
    setHighlightedAccounts([])
  }

  const handleRingSelect = (memberAccounts) => {
    setHighlightedAccounts(prev => {
      // If same ring clicked again, deselect
      const same = prev.length === memberAccounts.length &&
        memberAccounts.every(a => prev.includes(a))
      return same ? [] : memberAccounts
    })
    // Scroll graph into view
    document.getElementById('graph-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-screen hex-bg relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ background: 'radial-gradient(ellipse 100% 60% at 50% -5%, rgba(255,23,68,0.1) 0%, transparent 65%)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(0,229,255,0.04) 0%, transparent 50%)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 40% 40% at 5% 40%, rgba(255,23,68,0.03) 0%, transparent 50%)' }} className="absolute inset-0" />
      </div>

      <div className="relative z-10">
        <ThreatTicker />
        <div className="max-w-screen-2xl mx-auto px-6 pb-24">
          <Header />

          <UploadSection
            onSuccess={handleUploadSuccess}
            onError={setError}
            setLoading={setLoading}
            hasResults={!!analysisData}
            onReset={handleReset}
          />

          {error && (
            <div className="mt-6 anim-in">
              <ErrorAlert message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {analysisData && (
            <div id="results" className="mt-14 space-y-8">
              <div className="flex items-center justify-between anim-in">
                <div className="section-head flex-1">
                  <div className="flex items-center gap-3">
                    <div className="threat-dot" />
                    <span className="font-heading text-2xl font-bold text-white tracking-wide uppercase">
                      Threat Analysis Complete
                    </span>
                  </div>
                </div>
                <DownloadButton data={analysisData} />
              </div>

              <SummaryCards summary={analysisData.summary} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div id="graph-section" className="xl:col-span-2 anim-in d3">
                  <GraphVisualization
                    graph={analysisData.graph}
                    highlightedAccounts={highlightedAccounts}
                  />
                </div>
                <div className="xl:col-span-1 anim-in d4">
                  <SuspiciousAccountsPanel accounts={analysisData.suspicious_accounts} />
                </div>
              </div>

              <div className="anim-in d5">
                <FraudRingTable
                  rings={analysisData.fraud_rings}
                  onRingSelect={handleRingSelect}
                  highlightedAccounts={highlightedAccounts}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingOverlay />}
    </div>
  )
}