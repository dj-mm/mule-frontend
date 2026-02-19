import { useState, useRef } from 'react'
import axios from 'axios'
import { generateMockData } from '../utils/mockData'
import { transformApiResponse } from '../utils/apiTransformer'

const API_URL = '/analyze'

export default function UploadSection({ onSuccess, onError, setLoading, hasResults, onReset }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) { onError('Invalid file type. CSV only.'); return }
    setFile(f)
    onError(null)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleUpload = async () => {
    if (!file) return

    // Read CSV text for graph building
    const csvText = await file.text()

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setLoading(true)
    setProgress(0)
    setStatusMsg('Uploading CSV to detection engine...')

    try {
      setProgress(20)
      setStatusMsg('Analyzing transaction graph...')

      const res = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total)
          setProgress(Math.min(pct * 0.4, 40)) // upload = 0-40%
        },
        timeout: 120000, // 2 min timeout for large files
      })

      setProgress(70)
      setStatusMsg('Building network graph...')

      // Small delay to show graph building step
      await new Promise(r => setTimeout(r, 400))

      // Transform API response to frontend format
      const transformed = transformApiResponse(res.data, csvText)

      setProgress(95)
      setStatusMsg('Generating threat report...')

      await new Promise(r => setTimeout(r, 300))

      onSuccess(transformed)

    } catch (err) {
      console.error('API Error:', err)
      if (err.code === 'ECONNABORTED') {
        onError('Request timed out. The server may be processing a large file — try again.')
      } else if (err.response) {
        onError(`Server error ${err.response.status}: ${err.response.data?.message || err.response.data?.error || 'Unknown error'}`)
      } else if (err.request) {
        onError(`Cannot reach API at ${API_URL}. Check that the backend server at 10.193.189.75:3000 is running.`)
      } else {
        onError(err.message || 'Upload failed.')
      }
    } finally {
      setUploading(false)
      setLoading(false)
      setProgress(0)
      setStatusMsg('')
    }
  }

  const handleDemo = () => {
    setLoading(true)
    setTimeout(() => { onSuccess(generateMockData()); setLoading(false) }, 2400)
  }

  const handleReset = () => {
    setFile(null)
    setProgress(0)
    setStatusMsg('')
    onReset()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="anim-in d1">
      <div
        className={`drop-zone p-12 text-center ${dragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && inputRef.current?.click()}
      >
        {dragging && <div className="scan-line" />}
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />

        {!file ? (
          <div className="flex flex-col items-center gap-5">
            {/* Upload icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.15)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,23,68,0.7)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
                style={{ boxShadow: '0 0 8px rgba(255,23,68,0.8)', animation: 'livePulse 2s infinite' }} />
            </div>

            <div>
              <p className="font-heading text-xl font-bold text-white tracking-wide">
                DROP TRANSACTION CSV
              </p>
              <p className="mt-1.5 text-sm" style={{ color: '#4A5568' }}>
                or{' '}
                <span className="text-red-500 cursor-pointer hover:text-red-400 transition-colors">
                  browse files
                </span>
                {' '}— sends to detection engine at{' '}
                <span className="font-mono text-xs" style={{ color: '#3D4560' }}>10.193.189.75:3000</span>
              </p>
            </div>

            {/* Expected columns from your CSV */}
            <div className="flex flex-wrap justify-center gap-2">
              {['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'].map(col => (
                <span key={col} className="font-mono text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#4A5568' }}>
                  {col}
                </span>
              ))}
            </div>

            {/* API endpoint badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 6px rgba(0,229,255,0.8)' }} />
              <span className="font-mono text-xs" style={{ color: '#40C4FF' }}>POST</span>
              <span className="font-mono text-xs" style={{ color: '#3D4560' }}>http://10.193.189.75:3000/analyze</span>
            </div>

            <button
              onClick={e => { e.stopPropagation(); handleDemo() }}
              className="font-mono text-xs underline underline-offset-4 decoration-dotted transition-colors"
              style={{ color: '#3D4560' }}
              onMouseEnter={e => e.target.style.color = '#FF1744'}
              onMouseLeave={e => e.target.style.color = '#3D4560'}
            >
              → Run with built-in demo data (no API needed)
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
            {/* File ready */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.25)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>

            <div>
              <p className="font-heading text-lg font-bold text-white tracking-wide">{file.name}</p>
              <p className="font-mono text-xs mt-1" style={{ color: '#4A5568' }}>
                {(file.size / 1024).toFixed(1)} KB · CSV · Ready for analysis
              </p>
            </div>

            {/* Progress */}
            {uploading && (
              <div className="w-full max-w-sm">
                <div className="flex justify-between font-mono text-xs mb-2" style={{ color: '#4A5568' }}>
                  <span>{statusMsg}</span>
                  <span style={{ color: '#FF1744' }}>{progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#FF1744,#FF4569)', transition: 'width 0.5s ease' }} />
                </div>
                <p className="font-mono text-xs mt-2 text-center" style={{ color: '#3D4560' }}>
                  Sending to 10.193.189.75:3000/analyze...
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset} disabled={uploading} className="btn-ghost"
                style={{ opacity: uploading ? 0.4 : 1 }}>
                Clear
              </button>
              <button onClick={handleUpload} disabled={uploading} className="btn-primary">
                {uploading ? (
                  <>
                    <div className="loader-ring w-4 h-4" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    Run Detection Engine
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {hasResults && (
        <div className="mt-3 flex justify-end">
          <button onClick={handleReset}
            className="font-mono text-xs transition-colors flex items-center gap-1.5"
            style={{ color: '#3D4560' }}
            onMouseEnter={e => e.target.style.color = '#FF1744'}
            onMouseLeave={e => e.target.style.color = '#3D4560'}>
            ↺ New Analysis
          </button>
        </div>
      )}
    </section>
  )
}