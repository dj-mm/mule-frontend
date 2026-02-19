import { useEffect, useRef, useState, useCallback } from 'react'
import cytoscape from 'cytoscape'

export default function GraphVisualization({ graph, highlightedAccounts = [] }) {
  const cyRef = useRef(null)
  const cyInst = useRef(null)
  const tooltipRef = useRef(null)
  const [layout, setLayout] = useState('cose')
  const [stats, setStats] = useState({ nodes: 0, edges: 0, suspicious: 0 })
  const [viewMode, setViewMode] = useState('full') // 'full' | 'rings-only'

  const buildGraph = useCallback((graphData, mode) => {
    if (!graphData || !cyRef.current) return

    if (cyInst.current) {
      cyInst.current.destroy()
      cyInst.current = null
    }

    const allNodes = graphData.filter(el => !el.data?.source)
    const allEdges = graphData.filter(el => el.data?.source)
    const suspNodes = allNodes.filter(n => n.data?.suspicious || n.data?.suspicion_score > 0)
    const suspIds = new Set(suspNodes.map(n => n.data.id))

    // In rings-only mode: show only suspicious nodes + their edges
    let nodes, edges
    if (mode === 'rings-only') {
      nodes = suspNodes
      edges = allEdges.filter(e =>
        suspIds.has(e.data.source) && suspIds.has(e.data.target)
      )
    } else {
      // Full mode: show all but cap edges for performance
      nodes = allNodes
      // Prioritize edges connected to suspicious nodes
      const suspEdges = allEdges.filter(e => suspIds.has(e.data.source) || suspIds.has(e.data.target))
      const normalEdges = allEdges.filter(e => !suspIds.has(e.data.source) && !suspIds.has(e.data.target))
      const MAX_NORMAL = Math.max(0, 1500 - suspEdges.length)
      edges = [...suspEdges, ...normalEdges.slice(0, MAX_NORMAL)]
    }

    setStats({
      nodes: allNodes.length,
      edges: allEdges.length,
      suspicious: suspNodes.length,
      showing: nodes.length,
      showingEdges: edges.length,
    })

    const totalNodes = nodes.length
    // Dynamic sizing based on node count
    const nodeSize = totalNodes > 300 ? 14 : totalNodes > 100 ? 20 : totalNodes > 50 ? 28 : 36
    const suspSize = totalNodes > 300 ? 22 : totalNodes > 100 ? 30 : totalNodes > 50 ? 40 : 52
    const fontSize = totalNodes > 300 ? '0px' : totalNodes > 100 ? '7px' : '9px' // hide labels at scale
    const edgeWidth = totalNodes > 300 ? 0.5 : 1.2

    const cy = cytoscape({
      container: cyRef.current,
      elements: [...nodes, ...edges],
      style: [
        // === NORMAL NODE ===
        {
          selector: 'node',
          style: {
            'background-color': '#0D2A45',
            'border-color': '#1E5A8A',
            'border-width': 1.5,
            width: nodeSize,
            height: nodeSize,
            label: fontSize === '0px' ? '' : 'data(id)',
            'font-size': fontSize,
            'font-family': 'Share Tech Mono, monospace',
            color: 'rgba(160,200,255,0.8)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'text-outline-color': '#02020A',
            'text-outline-width': 2,
            'overlay-opacity': 0,
            'transition-property': 'background-color,border-color,width,height,opacity,border-width',
            'transition-duration': '300ms',
          },
        },
        // === SUSPICIOUS NODE ===
        {
          selector: 'node[?suspicious], node[suspicion_score > 0]',
          style: {
            'background-color': '#4A0A14',
            'border-color': '#FF6B00',
            'border-width': 2.5,
            width: suspSize,
            height: suspSize,
            label: 'data(id)',
            'font-size': '8px',
            color: 'rgba(255,200,150,0.9)',
            'z-index': 10,
          },
        },
        // === HOVER ===
        {
          selector: 'node.hovered',
          style: {
            'border-color': '#ffffff',
            'border-width': 3,
            'z-index': 999,
            label: 'data(id)',
            'font-size': '9px',
          },
        },
        // === RING HIGHLIGHTED ===
        {
          selector: 'node.ring-highlight',
          style: {
            'background-color': '#7A0A1E',
            'border-color': '#FFD700',
            'border-width': 4,
            width: mode === 'rings-only' ? suspSize * 1.4 : suspSize * 1.3,
            height: mode === 'rings-only' ? suspSize * 1.4 : suspSize * 1.3,
            label: 'data(id)',
            'font-size': '10px',
            color: '#FFD700',
            'text-outline-color': '#02020A',
            'text-outline-width': 2,
            'z-index': 999,
          },
        },
        // === DIMMED ===
        {
          selector: 'node.ring-dimmed',
          style: { opacity: 0.08 },
        },
        // === NORMAL EDGE ===
        {
          selector: 'edge',
          style: {
            width: edgeWidth,
            'line-color': 'rgba(30,90,138,0.25)',
            'target-arrow-color': 'rgba(30,90,138,0.3)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8,
            'curve-style': 'bezier',
            'overlay-opacity': 0,
            'transition-property': 'line-color,width,opacity',
            'transition-duration': '250ms',
          },
        },
        // === SUSPICIOUS EDGE ===
        {
          selector: 'edge[?suspicious_edge]',
          style: {
            width: edgeWidth * 2,
            'line-color': 'rgba(255,107,0,0.4)',
            'target-arrow-color': 'rgba(255,107,0,0.5)',
          },
        },
        // === HOVER EDGE ===
        {
          selector: 'edge.hovered',
          style: {
            width: 2.5,
            'line-color': 'rgba(255,23,68,0.6)',
            'target-arrow-color': 'rgba(255,23,68,0.7)',
          },
        },
        // === RING EDGE ===
        {
          selector: 'edge.ring-highlight',
          style: {
            width: 3,
            'line-color': 'rgba(255,215,0,0.8)',
            'target-arrow-color': 'rgba(255,215,0,0.9)',
            'z-index': 999,
          },
        },
        // === DIMMED EDGE ===
        {
          selector: 'edge.ring-dimmed',
          style: { opacity: 0.03 },
        },
      ],
      layout: getLayout(layout, nodes.length, mode),
      wheelSensitivity: 0.2,
      minZoom: 0.05,
      maxZoom: 8,
      boxSelectionEnabled: false,
    })

    cyInst.current = cy
    attachEvents(cy)
    return cy
  }, [layout])

  // Attach hover/tooltip events
  const attachEvents = (cy) => {
    const tooltip = tooltipRef.current
    if (!tooltip) return

    cy.on('mouseover', 'node', e => {
      const node = e.target
      node.addClass('hovered')
      node.connectedEdges().addClass('hovered')
      showTooltip(node, tooltip)
    })

    cy.on('mouseout', 'node', e => {
      e.target.removeClass('hovered')
      e.target.connectedEdges().removeClass('hovered')
      tooltip.style.display = 'none'
    })

    cy.on('tap', e => {
      if (e.target === cy) tooltip.style.display = 'none'
    })
  }

  const showTooltip = (node, tooltip) => {
    const d = node.data()
    const score = d.suspicion_score ?? 0
    const patterns = Array.isArray(d.detected_patterns) && d.detected_patterns.length
      ? d.detected_patterns.join(', ')
      : 'None'
    const isSusp = d.suspicious || score > 0
    const scoreColor = score > 80 ? '#FF4569' : score > 50 ? '#FFB300' : score > 0 ? '#FF8C00' : '#40C4FF'

    tooltip.innerHTML = `
      <div style="color:${isSusp ? '#FF6B00' : '#40C4FF'};font-size:11px;font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,107,0,0.25)">
        ${isSusp ? '⚠ SUSPICIOUS' : '◈ ACCOUNT'} · ${d.account_id || d.id}
      </div>
      ${d.ring_id ? `<div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:4px"><span style="color:#3D4560">Ring</span><span style="color:#FFD700;font-weight:600">${d.ring_id}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:4px">
        <span style="color:#3D4560">Score</span>
        <span style="color:${scoreColor};font-weight:600">${score}%</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px">
        <span style="color:#3D4560">Pattern</span>
        <span style="color:#F0F4FF;text-align:right;max-width:130px;word-break:break-word">${patterns}</span>
      </div>
    `
    const pos = node.renderedPosition()
    const rect = cyRef.current.getBoundingClientRect()
    let left = rect.left + pos.x + 18
    let top = rect.top + pos.y - 8 + window.scrollY
    if (left + 240 > window.innerWidth) left -= 255
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
    tooltip.style.display = 'block'
  }

  // Init graph
  useEffect(() => {
    buildGraph(graph, viewMode)
    return () => {
      if (cyInst.current) { cyInst.current.destroy(); cyInst.current = null }
      if (tooltipRef.current) tooltipRef.current.style.display = 'none'
    }
  }, [graph, layout, viewMode])

  // Apply ring highlights
  useEffect(() => {
    const cy = cyInst.current
    if (!cy) return

    cy.elements().removeClass('ring-highlight ring-dimmed')
    if (highlightedAccounts.length === 0) return

    highlightedAccounts.forEach(id => cy.getElementById(id).addClass('ring-highlight'))

    cy.edges().forEach(edge => {
      const src = edge.data('source')
      const tgt = edge.data('target')
      if (highlightedAccounts.includes(src) && highlightedAccounts.includes(tgt)) {
        edge.addClass('ring-highlight')
      } else {
        edge.addClass('ring-dimmed')
      }
    })

    cy.nodes().forEach(node => {
      if (!highlightedAccounts.includes(node.id())) node.addClass('ring-dimmed')
    })

    const ringNodes = cy.nodes().filter(n => highlightedAccounts.includes(n.id()))
    if (ringNodes.length > 0) {
      cy.animate({ fit: { eles: ringNodes, padding: 100 }, duration: 700, easing: 'ease-in-out-cubic' })
    }
  }, [highlightedAccounts])

  const handleViewMode = (mode) => {
    setViewMode(mode)
  }

  const handleClear = () => {
    const cy = cyInst.current
    if (!cy) return
    cy.elements().removeClass('ring-highlight ring-dimmed')
    cy.fit(undefined, 40)
  }

  const handleFit = () => {
    cyInst.current?.fit(undefined, 40)
  }

  return (
    <div className="glass-danger flex flex-col" style={{ height: 620 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF1744" strokeWidth="2">
              <circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/>
              <line x1="8" y1="12" x2="16" y2="6.5"/><line x1="8" y1="12" x2="16" y2="17.5"/>
            </svg>
          </div>
          <div>
            <div className="font-heading text-sm font-bold text-white tracking-wide uppercase">
              Transaction Network Graph
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: '#3D4560' }}>
              {stats.nodes?.toLocaleString()} accounts · {stats.edges?.toLocaleString()} transfers · {stats.suspicious} flagged
              {stats.showing && stats.showing < stats.nodes
                ? <span style={{ color: '#FFB300' }}> · showing {stats.showing}</span>
                : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(2,2,10,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => handleViewMode('full')}
              className="px-2.5 py-1 rounded-md font-mono text-xs transition-all"
              style={{
                background: viewMode === 'full' ? 'rgba(64,196,255,0.12)' : 'transparent',
                color: viewMode === 'full' ? '#40C4FF' : '#3D4560',
                border: viewMode === 'full' ? '1px solid rgba(64,196,255,0.2)' : '1px solid transparent',
              }}>
              Full
            </button>
            <button onClick={() => handleViewMode('rings-only')}
              className="px-2.5 py-1 rounded-md font-mono text-xs transition-all"
              style={{
                background: viewMode === 'rings-only' ? 'rgba(255,23,68,0.12)' : 'transparent',
                color: viewMode === 'rings-only' ? '#FF4569' : '#3D4560',
                border: viewMode === 'rings-only' ? '1px solid rgba(255,23,68,0.2)' : '1px solid transparent',
              }}>
              Rings Only
            </button>
          </div>

          {/* Layout */}
          <div className="flex gap-1 p-1 rounded-lg"
            style={{ background: 'rgba(2,2,10,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['cose', 'circle', 'breadthfirst'].map(l => (
              <button key={l} onClick={() => setLayout(l)}
                className="px-2.5 py-1 rounded-md font-mono text-xs transition-all"
                style={{
                  background: layout === l ? 'rgba(255,23,68,0.12)' : 'transparent',
                  color: layout === l ? '#FF4569' : '#3D4560',
                  border: layout === l ? '1px solid rgba(255,23,68,0.2)' : '1px solid transparent',
                }}>
                {l === 'breadthfirst' ? 'tree' : l}
              </button>
            ))}
          </div>

          {/* Clear ring */}
          {highlightedAccounts.length > 0 && (
            <button onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs"
              style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          )}

          {/* Fit */}
          <button onClick={handleFit}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#4A5568' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F0F4FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Ring highlight banner */}
      {highlightedAccounts.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-2" style={{ background: 'rgba(255,215,0,0.04)', borderBottom: '1px solid rgba(255,215,0,0.12)', flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.9)' }} />
          <span className="font-mono text-xs" style={{ color: '#FFD700' }}>
            {highlightedAccounts.length} ring nodes highlighted
          </span>
          <span className="font-mono text-xs truncate" style={{ color: '#3D4560' }}>
            {highlightedAccounts.slice(0, 4).join(' · ')}{highlightedAccounts.length > 4 ? ` +${highlightedAccounts.length - 4} more` : ''}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 px-5 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', flexShrink: 0 }}>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0D2A45', border: '1.5px solid #1E5A8A' }} />
          <span className="font-mono text-xs" style={{ color: '#3D4560' }}>Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4A0A14', border: '2.5px solid #FF6B00' }} />
          <span className="font-mono text-xs" style={{ color: '#3D4560' }}>Suspicious</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#7A0A1E', border: '3px solid #FFD700' }} />
          <span className="font-mono text-xs" style={{ color: '#3D4560' }}>Ring Selected</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ background: viewMode === 'rings-only' ? 'rgba(255,23,68,0.08)' : 'transparent',
              color: viewMode === 'rings-only' ? '#FF4569' : '#1E2438',
              border: viewMode === 'rings-only' ? '1px solid rgba(255,23,68,0.15)' : 'none' }}>
            {viewMode === 'rings-only' ? `Showing ${stats.suspicious} suspicious nodes only` : 'Scroll·zoom  Drag·pan'}
          </span>
        </div>
      </div>

      {/* Cytoscape */}
      <div ref={cyRef} className="flex-1" style={{ background: 'transparent', minHeight: 0 }} />
      <div ref={tooltipRef} className="cy-tooltip" style={{ display: 'none' }} />
    </div>
  )
}

function getLayout(name, nodeCount, mode) {
  const base = {
    animate: true,
    animationDuration: nodeCount > 200 ? 600 : 900,
    fit: true,
    padding: mode === 'rings-only' ? 60 : 30,
  }

  if (name === 'cose') {
    return {
      ...base,
      name: 'cose',
      nodeRepulsion: nodeCount > 300 ? 800000 : nodeCount > 100 ? 400000 : 200000,
      idealEdgeLength: nodeCount > 300 ? 30 : nodeCount > 100 ? 50 : 80,
      edgeElasticity: 100,
      gravity: nodeCount > 300 ? 80 : 50,
      numIter: nodeCount > 300 ? 500 : 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
      randomize: false,
    }
  }

  if (name === 'circle') {
    return { ...base, name: 'circle', spacingFactor: nodeCount > 100 ? 0.6 : 1.2 }
  }

  if (name === 'breadthfirst') {
    return { ...base, name: 'breadthfirst', directed: true, spacingFactor: nodeCount > 100 ? 0.7 : 1.2, maximalAdjacency: true }
  }

  return { ...base, name }
}