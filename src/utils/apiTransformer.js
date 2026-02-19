/**
 * Transforms API response from http://10.193.189.75:3000/analyze
 * Optimized for large datasets (10k+ transactions, 600+ accounts)
 */
export function transformApiResponse(apiData, csvText = null) {
  const { suspicious_accounts = [], fraud_rings = [], summary = {} } = apiData

  const suspiciousIds = new Set(suspicious_accounts.map(a => a.account_id))

  // account_id → suspicion data map
  const suspicionMap = {}
  suspicious_accounts.forEach(acc => { suspicionMap[acc.account_id] = acc })

  // ring_id → ring data map
  const ringMap = {}
  fraud_rings.forEach(ring => { ringMap[ring.ring_id] = ring })

  // All account IDs
  const allAccountIds = new Set()
  fraud_rings.forEach(r => r.member_accounts.forEach(a => allAccountIds.add(a)))
  suspicious_accounts.forEach(a => allAccountIds.add(a.account_id))

  // Build edges from CSV
  const edges = []
  const edgeSet = new Set()
  let totalTransactions = 0
  let flaggedVolume = 0

  if (csvText) {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const senderIdx = headers.indexOf('sender_id')
    const receiverIdx = headers.indexOf('receiver_id')
    const amountIdx = headers.indexOf('amount')
    const txIdx = headers.indexOf('transaction_id')

    totalTransactions = lines.length - 1

    // First pass: collect all account IDs
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      const sender = cols[senderIdx]?.trim()
      const receiver = cols[receiverIdx]?.trim()
      if (sender) allAccountIds.add(sender)
      if (receiver) allAccountIds.add(receiver)
    }

    // Second pass: build edges — priority order:
    // 1. Ring-to-ring edges (always include)
    // 2. Suspicious-to-any edges
    // 3. Normal edges (capped)
    const ringEdges = []
    const suspEdges = []
    const normalEdges = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      const sender = cols[senderIdx]?.trim()
      const receiver = cols[receiverIdx]?.trim()
      const amount = parseFloat(cols[amountIdx]) || 0
      const txId = cols[txIdx]?.trim() || `e_${i}`

      if (!sender || !receiver || sender === receiver) continue

      const edgeKey = `${sender}__${receiver}`
      if (edgeSet.has(edgeKey)) continue
      edgeSet.add(edgeKey)

      const isSrcSusp = suspiciousIds.has(sender)
      const isTgtSusp = suspiciousIds.has(receiver)

      if (isSrcSusp && isTgtSusp) flaggedVolume += amount

      const edgeObj = {
        group: 'edges',
        data: {
          id: txId,
          source: sender,
          target: receiver,
          amount,
          suspicious_edge: isSrcSusp && isTgtSusp,
        },
      }

      if (isSrcSusp && isTgtSusp) ringEdges.push(edgeObj)
      else if (isSrcSusp || isTgtSusp) suspEdges.push(edgeObj)
      else normalEdges.push(edgeObj)
    }

    // Smart edge cap: always show ring + suspicious edges, sample normal ones
    const MAX_NORMAL = 800
    const sampledNormal = sampleEdges(normalEdges, MAX_NORMAL)
    edges.push(...ringEdges, ...suspEdges, ...sampledNormal)

  } else {
    // No CSV: build ring cycle edges only
    fraud_rings.forEach(ring => {
      for (let i = 0; i < ring.member_accounts.length; i++) {
        const src = ring.member_accounts[i]
        const tgt = ring.member_accounts[(i + 1) % ring.member_accounts.length]
        const key = `${src}__${tgt}`
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          edges.push({
            group: 'edges',
            data: { id: key, source: src, target: tgt, amount: 0, suspicious_edge: true },
          })
        }
      }
    })
    totalTransactions = edges.length
  }

  // Build nodes
  const nodes = Array.from(allAccountIds).map(id => {
    const suspData = suspicionMap[id]
    return {
      group: 'nodes',
      data: {
        id,
        account_id: id,
        suspicious: suspiciousIds.has(id),
        suspicion_score: suspData?.suspicion_score ?? 0,
        detected_patterns: suspData?.detected_patterns ?? [],
        ring_id: suspData?.ring_id ?? null,
      },
    }
  })

  // Transform fraud rings — add member_count
  const transformedRings = fraud_rings.map(ring => ({
    ...ring,
    member_count: ring.member_accounts.length,
  }))

  // Summary
  const transformedSummary = {
    total_accounts: summary.total_accounts_analyzed ?? allAccountIds.size,
    total_transactions: totalTransactions || summary.total_transactions || edges.length,
    suspicious_count: summary.suspicious_accounts_flagged ?? suspicious_accounts.length,
    fraud_ring_count: summary.fraud_rings_detected ?? fraud_rings.length,
    overall_risk_score: calcRiskScore(suspicious_accounts, fraud_rings, summary),
    flagged_volume: Math.round(flaggedVolume),
    processing_time: summary.processing_time_seconds ?? null,
  }

  return {
    graph: [...nodes, ...edges],
    suspicious_accounts,
    fraud_rings: transformedRings,
    summary: transformedSummary,
  }
}

// Evenly sample edges to avoid bias toward one region of the graph
function sampleEdges(edges, max) {
  if (edges.length <= max) return edges
  const step = edges.length / max
  const result = []
  for (let i = 0; i < max; i++) {
    result.push(edges[Math.floor(i * step)])
  }
  return result
}

function calcRiskScore(suspAccounts, rings, summary) {
  const total = summary.total_accounts_analyzed || 1
  const suspCount = summary.suspicious_accounts_flagged || suspAccounts.length
  const ringCount = summary.fraud_rings_detected || rings.length
  const suspRatio = (suspCount / total) * 100
  const ringRisk = Math.min(ringCount * 4, 35)
  const avgScore = suspAccounts.length > 0
    ? suspAccounts.reduce((s, a) => s + (a.suspicion_score || 0), 0) / suspAccounts.length
    : 0
  return Math.min(Math.round(suspRatio * 2 + ringRisk + avgScore * 0.3), 99)
}