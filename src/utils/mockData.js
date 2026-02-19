import { transformApiResponse } from './apiTransformer'

/**
 * Generates mock data that exactly mirrors the real API response shape
 * from http://10.193.189.75:3000/analyze
 */
export function generateMockData() {
  const mockApiResponse = {
    suspicious_accounts: [
      { account_id: 'ACC_00466', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_002' },
      { account_id: 'ACC_00167', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_002' },
      { account_id: 'ACC_00080', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_002' },
      { account_id: 'ACC_00229', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_003' },
      { account_id: 'ACC_00440', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_003' },
      { account_id: 'ACC_00078', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_003' },
      { account_id: 'ACC_00493', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_004' },
      { account_id: 'ACC_00375', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_004' },
      { account_id: 'ACC_00586', suspicion_score: 45, detected_patterns: ['cycle_length_3'], ring_id: 'RING_004' },
      { account_id: 'ACC_00505', suspicion_score: 42, detected_patterns: ['cycle_length_4'], ring_id: 'RING_009' },
      { account_id: 'ACC_00433', suspicion_score: 42, detected_patterns: ['cycle_length_4'], ring_id: 'RING_009' },
      { account_id: 'ACC_00192', suspicion_score: 42, detected_patterns: ['cycle_length_4'], ring_id: 'RING_009' },
      { account_id: 'ACC_00019', suspicion_score: 42, detected_patterns: ['cycle_length_4'], ring_id: 'RING_009' },
      { account_id: 'ACC_00150', suspicion_score: 40, detected_patterns: ['cycle_length_5'], ring_id: 'RING_001' },
      { account_id: 'ACC_00032', suspicion_score: 40, detected_patterns: ['cycle_length_5'], ring_id: 'RING_001' },
      { account_id: 'ACC_00114', suspicion_score: 40, detected_patterns: ['cycle_length_5'], ring_id: 'RING_001' },
      { account_id: 'ACC_00597', suspicion_score: 40, detected_patterns: ['cycle_length_5'], ring_id: 'RING_001' },
      { account_id: 'ACC_00419', suspicion_score: 40, detected_patterns: ['cycle_length_5'], ring_id: 'RING_001' },
    ],
    fraud_rings: [
      { ring_id: 'RING_001', member_accounts: ['ACC_00150','ACC_00032','ACC_00114','ACC_00597','ACC_00419'], pattern_type: 'cycle', risk_score: 90 },
      { ring_id: 'RING_002', member_accounts: ['ACC_00466','ACC_00167','ACC_00080'], pattern_type: 'cycle', risk_score: 90 },
      { ring_id: 'RING_003', member_accounts: ['ACC_00229','ACC_00440','ACC_00078'], pattern_type: 'cycle', risk_score: 90 },
      { ring_id: 'RING_004', member_accounts: ['ACC_00493','ACC_00375','ACC_00586'], pattern_type: 'cycle', risk_score: 90 },
      { ring_id: 'RING_009', member_accounts: ['ACC_00505','ACC_00433','ACC_00192','ACC_00019'], pattern_type: 'cycle', risk_score: 90 },
    ],
    summary: {
      total_accounts_analyzed: 600,
      suspicious_accounts_flagged: 18,
      fraud_rings_detected: 5,
      processing_time_seconds: 27.774,
    },
  }

  // Build mock CSV edges between ring members + some random accounts
  const extraAccounts = Array.from({ length: 30 }, (_, i) => `ACC_MOCK_${String(i).padStart(3,'0')}`)
  const allSuspicious = mockApiResponse.suspicious_accounts.map(a => a.account_id)
  const allAccounts = [...new Set([...allSuspicious, ...extraAccounts])]

  // Build CSV-like edge list
  const edges = []
  const edgeSet = new Set()

  // Ring cycle edges
  mockApiResponse.fraud_rings.forEach(ring => {
    for (let i = 0; i < ring.member_accounts.length; i++) {
      const src = ring.member_accounts[i]
      const tgt = ring.member_accounts[(i + 1) % ring.member_accounts.length]
      const key = `${src}__${tgt}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ group: 'edges', data: { id: key, source: src, target: tgt, amount: Math.random() * 10000 + 500 } })
      }
    }
  })

  // Random edges between other accounts
  for (let i = 0; i < 60; i++) {
    const src = allAccounts[Math.floor(Math.random() * allAccounts.length)]
    const tgt = allAccounts[Math.floor(Math.random() * allAccounts.length)]
    const key = `${src}__${tgt}`
    if (src !== tgt && !edgeSet.has(key)) {
      edgeSet.add(key)
      edges.push({ group: 'edges', data: { id: key, source: src, target: tgt, amount: Math.random() * 5000 } })
    }
  }

  return transformApiResponse(mockApiResponse, null)
}