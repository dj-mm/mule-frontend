/**
 * Transforms the real API response from http://10.193.189.75:3000/analyze
 * into the format expected by the frontend components.
 *
 * API Response shape:
 * {
 *   suspicious_accounts: [{ account_id, suspicion_score, detected_patterns, ring_id }],
 *   fraud_rings: [{ ring_id, member_accounts, pattern_type, risk_score }],
 *   summary: { total_accounts_analyzed, suspicious_accounts_flagged, fraud_rings_detected, processing_time_seconds }
 * }
 */
export function transformApiResponse(apiData, csvText = null) {
  const { suspicious_accounts = [], fraud_rings = [], summary = {} } = apiData

  // Build set of all suspicious account IDs for quick lookup
  const suspiciousIds = new Set(suspicious_accounts.map(a => a.account_id))

  // Build map of account -> suspicion data
  const suspicionMap = {}
  suspicious_accounts.forEach(acc => {
    suspicionMap[acc.account_id] = acc
  })

  // Collect ALL unique account IDs from CSV or from rings + suspicious
  let allAccountIds = new Set()

  // Parse CSV to get all accounts + build edges
  const edges = []
  const edgeSet = new Set()

  if (csvText) {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const senderIdx = headers.indexOf('sender_id')
    const receiverIdx = headers.indexOf('receiver_id')
    const amountIdx = headers.indexOf('amount')
    const txIdx = headers.indexOf('transaction_id')

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      const sender = cols[senderIdx]?.trim()
      const receiver = cols[receiverIdx]?.trim()
      const amount = parseFloat(cols[amountIdx]) || 0
      const txId = cols[txIdx]?.trim()

      if (!sender || !receiver) continue
      allAccountIds.add(sender)
      allAccountIds.add(receiver)

      const edgeKey = `${sender}__${receiver}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push({
          group: 'edges',
          data: {
            id: txId || edgeKey,
            source: sender,
            target: receiver,
            amount,
          },
        })
      }
    }
  } else {
    // Fallback: build from ring members + suspicious accounts
    fraud_rings.forEach(ring => {
      ring.member_accounts.forEach(acc => allAccountIds.add(acc))
      // Create ring cycle edges
      for (let i = 0; i < ring.member_accounts.length; i++) {
        const src = ring.member_accounts[i]
        const tgt = ring.member_accounts[(i + 1) % ring.member_accounts.length]
        const edgeKey = `${src}__${tgt}`
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey)
          edges.push({
            group: 'edges',
            data: { id: edgeKey, source: src, target: tgt, amount: 0 },
          })
        }
      }
    })
    suspicious_accounts.forEach(a => allAccountIds.add(a.account_id))
  }

  // Build nodes
  const nodes = Array.from(allAccountIds).map(id => {
    const suspData = suspicionMap[id]
    const isSusp = suspiciousIds.has(id)
    return {
      group: 'nodes',
      data: {
        id,
        account_id: id,
        suspicious: isSusp,
        suspicion_score: suspData?.suspicion_score ?? 0,
        detected_patterns: suspData?.detected_patterns ?? [],
        ring_id: suspData?.ring_id ?? null,
      },
    }
  })

  // Build graph (limit edges for performance if very large)
  const MAX_EDGES = 2000
  const graphEdges = edges.length > MAX_EDGES
    ? [
        // Always include ring edges
        ...edges.filter(e => suspiciousIds.has(e.data.source) || suspiciousIds.has(e.data.target)),
        // Fill rest with normal edges
        ...edges
          .filter(e => !suspiciousIds.has(e.data.source) && !suspiciousIds.has(e.data.target))
          .slice(0, MAX_EDGES - edges.filter(e => suspiciousIds.has(e.data.source) || suspiciousIds.has(e.data.target)).length),
      ]
    : edges

  // Transform summary
  const transformedSummary = {
    total_accounts: summary.total_accounts_analyzed ?? allAccountIds.size,
    total_transactions: edges.length,
    suspicious_count: summary.suspicious_accounts_flagged ?? suspicious_accounts.length,
    fraud_ring_count: summary.fraud_rings_detected ?? fraud_rings.length,
    overall_risk_score: calculateRiskScore(suspicious_accounts, fraud_rings, summary),
    flagged_volume: calculateFlaggedVolume(edges, suspiciousIds),
    processing_time: summary.processing_time_seconds ?? null,
  }

  // Transform fraud rings — add member_count
  const transformedRings = fraud_rings.map(ring => ({
    ...ring,
    member_count: ring.member_accounts.length,
  }))

  return {
    graph: [...nodes, ...graphEdges],
    suspicious_accounts,
    fraud_rings: transformedRings,
    summary: transformedSummary,
  }
}

function calculateRiskScore(suspAccounts, rings, summary) {
  const totalAccounts = summary.total_accounts_analyzed || 1
  const suspCount = summary.suspicious_accounts_flagged || suspAccounts.length
  const ringCount = summary.fraud_rings_detected || rings.length

  // Weighted risk score
  const suspicionRatio = (suspCount / totalAccounts) * 100
  const ringRisk = Math.min(ringCount * 5, 40)
  const avgScore = suspAccounts.length > 0
    ? suspAccounts.reduce((sum, a) => sum + (a.suspicion_score || 0), 0) / suspAccounts.length
    : 0

  return Math.min(Math.round(suspicionRatio * 2 + ringRisk + avgScore * 0.3), 99)
}

function calculateFlaggedVolume(edges, suspiciousIds) {
  return edges
    .filter(e => suspiciousIds.has(e.data.source) || suspiciousIds.has(e.data.target))
    .reduce((sum, e) => sum + (e.data.amount || 0), 0)
}