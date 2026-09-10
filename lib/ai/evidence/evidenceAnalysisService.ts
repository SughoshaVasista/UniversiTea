/**
 * Phase 10 — Evidence Analysis Service
 *
 * Analyzes submitted receipts/evidence.
 * Validates URLs for safety, classifies sources, and provides credibility signals.
 * AI cannot authenticate a screenshot — it remains user-submitted evidence.
 */

import { getAIProvider } from '../provider'
import { validateEvidenceAnalysisResult } from '../validation/outputValidator'
import { validateURL } from './urlSafetyService'

export async function analyzeReceipt(description: string, sourceUrl?: string) {
  // 1. URL safety check (if URL provided)
  if (sourceUrl) {
    const urlCheck = validateURL(sourceUrl)
    if (!urlCheck.safe) {
      return {
        sourceType: 'UNKNOWN',
        credibilitySignal: 'UNKNOWN',
        domainTrusted: false,
        issues: [`Unsafe URL blocked: ${urlCheck.reason}`],
        explanation: `The provided URL was blocked for safety reasons: ${urlCheck.reason}`,
        urlBlocked: true,
      }
    }
  }

  // 2. AI analysis
  try {
    const ai = getAIProvider()
    const raw = await ai.analyzeEvidence(description, sourceUrl)
    const result = validateEvidenceAnalysisResult(raw)
    return { ...result, urlBlocked: false }
  } catch (err) {
    console.error('[EvidenceAnalysis] AI analysis failed:', err)
    return {
      sourceType: 'UNKNOWN',
      credibilitySignal: 'UNKNOWN',
      domainTrusted: false,
      issues: ['Evidence analysis temporarily unavailable.'],
      explanation: 'AI analysis failed; evidence will be reviewed manually.',
      urlBlocked: false,
    }
  }
}
