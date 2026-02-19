import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'

export default function GraphVisualization({ graph, highlightedAccounts = [] }) {
  const cyRef = useRef(null)
  const cyInst = useRef(null)
  const tooltipRef = useRef(null)
  const [layout, setLayout] = useState('cose')
  const [stats, setStats] = useState({ nodes: 0, edges: 0, suspicious: 0 })

  // Initialize Cytoscape
  useEffect(() => {
    if (!graph || !cyRef.current) return
    if (cyInst.current) cyInst.current.destroy()

    const nodes = graph.filter(el => !el.data?.source)
    const edges = graph.filter(el => el.data?.source)
    const suspNodes = nodes.filter(n => n.data?.suspicious || n.data?.suspicion_score > 50)
    setStats({ nodes: nodes.length, edges: edges.length, suspicious: suspNodes.length })

    const cy = cytoscape({
      container: cyRef.current,
      elements: graph,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1a3a5c',
            'border-color': '#40C4FF',
            'border-width': 2,
            width: 38, height: 38,
            label: 'data(id)',
            'font-size': '9px',
            'font-family': 'Share Tech Mono, monospace',
            color: 'rgba(200,220,255,0.75)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            'text-outline-color': '#02020A',
            'text-outline-width': 2,
            'overlay-opacity': 0,
            'transition-property': 'background-color,border-color,width,height,border-width,opacity',
            'transition-duration': '300ms',
          },
        },
        {
          selector: 'node[?suspicious], node[suspicion_score > 50]',
          style: {
            'background-color': '#3D0A14',
            'border-color': '#FFB300',
            'border-width': 3,
            width: 56, height: 56,
          },
        },
        {
          selector: 'node.hovered',
          style: {
            'border-color': '#ffffff',
            'border-width': 3,
            width: 58, height: 58,
            'z-index': 999,
          },
        },
        // Ring highlight styles
        {
          selector: 'node.ring-highlight',
          style: {
            'background-color': '#FF1744',
            'border-color': '#FFD740',
            'border-width': 5,
            width: 64, height: 64,
            'z-index': 998,
            color: '#ffffff',
            'font-size': '10px',
          },
        },
        {
          selector: 'node.ring-dimmed',
          style: {
            opacity: 0.15,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.2,
            'line-color': 'rgba(64,196,255,0.15)',
            'target-arrow-color': 'rgba(64,196,255,0.2)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.1,
            'curve-style': 'bezier',
            'overlay-opacity': 0,
            'transition-property': 'line-color,width,opacity',
            'transition-duration': '300ms',
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            width: 2.5,
            'line-color': 'rgba(255,23,68,0.5)',
            'target-arrow-color': 'rgba(255,23,68,0.6)',
          },
        },
        {
          selector: 'edge.ring-highlight',
          style: {
            width: 3,
            'line-color': 'rgba(255,215,64,0.7)',
            'target-arrow-color': 'rgba(255,215,64,0.8)',
            'z-index': 998,
          },
        },
        {
          selector: 'edge.ring-dimmed',
          style: { opacity: 0.05 },
        },
      ],
      layout: {
        name: layout,
        animate: true,
        animationDuration: 900,
        padding: 48,
        nodeRepulsion: 5000,
        idealEdgeLength: 90,
        fit: true,
      },
      wheelSensitivity: 0.25,
      minZoom: 0.15,
      maxZoom: 5,
    })

    cyInst.current = cy
    const tooltip = tooltipRef.current

    const showTooltip = (node) => {
      const d = node.data()
      const score = d.suspicion_score ?? 'N/A'
      const patterns = Array.isArray(d.detected_patterns)
        ? d.detected_patterns.join(', ')
        : d.detected_patterns || 'None'
      const isSusp = d.suspicious || d.suspicion_score > 50
      const scoreColor = score > 80 ? '#FF4569' : score > 50 ? '#FFD740' : '#40C4FF'

      tooltip.innerHTML = `
        <div style="color:${isSusp ? '#FF4569' : '#40C4FF'};font-size:11px;font-weight:600;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,23,68,0.2)">
          ${isSusp ? '⚠ SUSPICIOUS NODE' : '◈ ACCOUNT'} · ${d.account_id || d.id}
        </div>
        <div style="display:flex;justify-content:space-between;gap:16px">
          <span style="color:#3D4560">Threat Score</span>
          <span style="color:${scoreColor};font-weight:600">${score}${typeof score === 'number' ? '%' : ''}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px">
          <span style="color:#3D4560">Patterns</span>
          <span style="color:#F0F4FF;text-align:right;max-width:140px;word-break:break-word">${patterns}</span>
        </div>
        ${d.total_volume != null ? `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:4px"><span style="color:#3D4560">Volume</span><span style="color:#F0F4FF">$${Number(d.total_volume).toLocaleString()}</span></div>` : ''}
      `
      const pos = node.renderedPosition()
      const rect = cyRef.current.getBoundingClientRect()
      let left = rect.left + pos.x + 22
      let top = rect.top + pos.y - 10 + window.scrollY
      if (left + 260 > window.innerWidth) left -= 280
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
      tooltip.style.display = 'block'
    }

    cy.on('mouseover', 'node', e => {
      e.target.addClass('hovered')
      e.target.connectedEdges().addClass('highlighted')
      showTooltip(e.target)
    })
    cy.on('mouseout', 'node', e => {
      e.target.removeClass('hovered')
      e.target.connectedEdges().removeClass('highlighted')
      tooltip.style.display = 'none'
    })
    cy.on('tap', e => { if (e.target === cy) tooltip.style.display = 'none' })

    return () => { tooltip.style.display = 'none'; cy.destroy() }
  }, [graph, layout])

  // React to ring highlight changes
  useEffect(() => {
    const cy = cyInst.current
    if (!cy) return

    // Clear all highlight classes
    cy.elements().removeClass('ring-highlight ring-dimmed')

    if (highlightedAccounts.length === 0) return

    // Highlight ring nodes
    highlightedAccounts.forEach(accountId => {
      cy.getElementById(accountId).addClass('ring-highlight')
    })

    // Highlight edges between ring members
    cy.edges().forEach(edge => {
      const src = edge.data('source')
      const tgt = edge.data('target')
      if (highlightedAccounts.includes(src) && highlightedAccounts.includes(tgt)) {
        edge.addClass('ring-highlight')
      } else {
        edge.addClass('ring-dimmed')
      }
    })

    // Dim non-ring nodes
    cy.nodes().forEach(node => {
      if (!highlightedAccounts.includes(node.id())) {
        node.addClass('ring-dimmed')
      }
    })

    // Fit + zoom to highlighted nodes with animation
    const ringNodes = cy.nodes().filter(n => highlightedAccounts.includes(n.id()))
    if (ringNodes.length > 0) {
      cy.animate({
        fit: { eles: ringNodes, padding: 80 },
        duration: 600,
        easing: 'ease-in-out-cubic',
      })
    }
  }, [highlightedAccounts])

  const reLayout = (l) => {
    setLayout(l)
    cyInst.current?.layout({ name: l, animate: true, padding: 48 }).run()
  }

  const handleClearHighlight = () => {
    cyInst.current?.elements().removeClass('ring-highlight ring-dimmed')
    cyInst.current?.fit(undefined, 48)
  }

  return (
    <div className="glass-danger flex flex-col" style={{ height: 600 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="2">
              <circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/>
              <line x1="8" y1="12" x2="16" y2="6.5"/><line x1="8" y1="12" x2="16" y2="17.5"/>
            </svg>
          </div>
          <div>
            <div className="font-heading text-base font-bold text-white tracking-wide uppercase">Transaction Network Graph</div>
            <div className="font-mono text-xs mt-0.5" style={{ color: '#3D4560' }}>
              {stats.nodes} accounts · {stats.edges} transfers · {stats.suspicious} flagged
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear highlight button */}
          {highlightedAccounts.length > 0 && (
            <button
              onClick={handleClearHighlight}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
              style={{ background: 'rgba(255,215,64,0.1)', border: '1px solid rgba(255,215,64,0.3)', color: '#FFD740' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear Ring
            </button>
          )}

          {/* Layout switcher */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(2,2,10,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {['cose', 'breadthfirst', 'circle'].map(l => (
              <button key={l} onClick={() => reLayout(l)}
                className="px-3 py-1 rounded-md font-mono text-xs transition-all"
                style={{
                  background: layout === l ? 'rgba(255,23,68,0.15)' : 'transparent',
                  color: layout === l ? '#FF4569' : '#3D4560',
                  border: layout === l ? '1px solid rgba(255,23,68,0.25)' : '1px solid transparent',
                }}>
                {l}
              </button>
            ))}
          </div>

          <button onClick={() => { cyInst.current?.elements().removeClass('ring-highlight ring-dimmed'); cyInst.current?.fit(undefined, 48) }}
            title="Fit to screen"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#4A5568' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F0F4FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Ring highlight banner */}
      {highlightedAccounts.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-2" style={{ background: 'rgba(255,215,64,0.05)', borderBottom: '1px solid rgba(255,215,64,0.15)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD740', boxShadow: '0 0 8px rgba(255,215,64,0.8)', animation: 'livePulse 1s infinite' }} />
          <span className="font-mono text-xs" style={{ color: '#FFD740' }}>
            Ring selected — {highlightedAccounts.length} nodes highlighted
          </span>
          <span className="font-mono text-xs" style={{ color: '#3D4560' }}>
            {highlightedAccounts.join(' · ')}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 px-6 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        {[
          { dot: '#40C4FF', border: '#40C4FF', label: 'Normal', size: 10 },
          { dot: '#3D0A14', border: '#FFB300', label: 'Suspicious', size: 14 },
          { dot: '#FF1744', border: '#FFD740', label: 'Ring Selected', size: 14 },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="rounded-full" style={{ width: l.size, height: l.size, background: l.dot, border: `2px solid ${l.border}` }} />
            <span className="font-mono text-xs" style={{ color: '#3D4560' }}>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div style={{ width: 20, height: 1, background: 'rgba(64,196,255,0.3)' }} />
          <span className="font-mono text-xs" style={{ color: '#3D4560' }}>Transfer</span>
        </div>
        <span className="font-mono text-xs ml-auto" style={{ color: '#1E2438' }}>Scroll·zoom  Drag·pan</span>
      </div>

      {/* Graph */}
      <div ref={cyRef} className="flex-1" style={{ background: 'transparent' }} />
      <div ref={tooltipRef} className="cy-tooltip" style={{ display: 'none' }} />
    </div>
  )
}