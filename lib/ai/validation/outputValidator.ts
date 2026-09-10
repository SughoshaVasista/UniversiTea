/**
 * Phase 10 — AI Output Validation
 *
 * Validates AI responses against strict schemas.
 * If AI output is malformed, returns a safe fallback (allow content through).
 * Never blocks legitimate posts because the AI failed.
 */

import type {
  ContentSafetyResult,
  PIIDetectionResult,
  ClaimExtractionResult,
  EvidenceAnalysisResult,
  RiskLevel,
  ModerationCategory,
  ClaimType,
} from '../types'

const VALID_RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const VALID_CATEGORIES: ModerationCategory[] = [
  'HARASSMENT', 'THREAT', 'DOXXING', 'HATE', 'SPAM', 'PII',
  'TARGETED_ALLEGATION', 'SEXUAL_PRIVATE_CONTENT', 'OTHER',
]

const VALID_CLAIM_TYPES: ClaimType[] = [
  'FACTUAL', 'RUMOUR', 'PREDICTION', 'OPINION', 'QUESTION', 'SATIRE', 'NOT_VERIFIABLE',
]

function isValidConfidence(n: unknown): n is number {
  return typeof n === 'number' && n >= 0 && n <= 1
}

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, n))
}

// ─── Validators ───────────────────────────────────────────────────

export function validateContentSafetyResult(raw: unknown): ContentSafetyResult {
  const fallback: ContentSafetyResult = {
    riskLevel: 'LOW',
    categories: ['OTHER'],
    explanation: 'AI output validation failed; content allowed by default.',
    confidence: 0,
  }

  if (!raw || typeof raw !== 'object') return fallback
  const obj = raw as Record<string, unknown>

  const riskLevel = VALID_RISK_LEVELS.includes(obj.riskLevel as RiskLevel)
    ? (obj.riskLevel as RiskLevel)
    : 'LOW'

  const categories = Array.isArray(obj.categories)
    ? (obj.categories.filter((c): c is ModerationCategory => VALID_CATEGORIES.includes(c as ModerationCategory)) as ModerationCategory[])
    : (['OTHER'] as ModerationCategory[])

  const explanation = typeof obj.explanation === 'string' && obj.explanation.length < 2000
    ? obj.explanation
    : 'No explanation provided.'

  const confidence = isValidConfidence(obj.confidence)
    ? clampConfidence(obj.confidence)
    : 0

  return { riskLevel, categories: categories.length > 0 ? categories : ['OTHER'], explanation, confidence }
}

export function validatePIIDetectionResult(raw: unknown): PIIDetectionResult {
  const fallback: PIIDetectionResult = { hasPII: false, matches: [], riskLevel: 'LOW' }

  if (!raw || typeof raw !== 'object') return fallback
  const obj = raw as Record<string, unknown>

  const matches = Array.isArray(obj.matches)
    ? obj.matches.filter((m: any) =>
        m && typeof m.type === 'string' && typeof m.value === 'string' &&
        typeof m.startIndex === 'number' && typeof m.endIndex === 'number'
      ).map((m: any) => ({
        type: m.type,
        value: String(m.value).substring(0, 200),
        confidence: isValidConfidence(m.confidence) ? clampConfidence(m.confidence) : 0.5,
        startIndex: m.startIndex,
        endIndex: m.endIndex,
      }))
    : []

  const riskLevel = VALID_RISK_LEVELS.includes(obj.riskLevel as RiskLevel)
    ? (obj.riskLevel as RiskLevel)
    : 'LOW'

  return {
    hasPII: matches.length > 0,
    matches,
    riskLevel,
  }
}

export function validateClaimExtractionResult(raw: unknown): ClaimExtractionResult {
  const fallback: ClaimExtractionResult = { claims: [], method: 'unknown' }

  if (!raw || typeof raw !== 'object') return fallback
  const obj = raw as Record<string, unknown>

  const claims = Array.isArray(obj.claims)
    ? obj.claims
        .filter((c: any) => c && typeof c.statement === 'string' && c.statement.length > 0 && c.statement.length < 5000)
        .map((c: any) => ({
          statement: c.statement,
          claimType: VALID_CLAIM_TYPES.includes(c.claimType) ? c.claimType : 'NOT_VERIFIABLE',
          confidence: isValidConfidence(c.confidence) ? clampConfidence(c.confidence) : 0.5,
          originalSpan: typeof c.originalSpan === 'string' ? c.originalSpan.substring(0, 5000) : undefined,
        }))
    : []

  const method = typeof obj.method === 'string' && obj.method.length < 100
    ? obj.method
    : 'unknown'

  return { claims, method }
}

export function validateEvidenceAnalysisResult(raw: unknown): EvidenceAnalysisResult {
  const fallback: EvidenceAnalysisResult = {
    sourceType: 'UNKNOWN',
    credibilitySignal: 'UNKNOWN',
    domainTrusted: false,
    issues: ['AI analysis could not be validated.'],
    explanation: 'AI output validation failed.',
  }

  if (!raw || typeof raw !== 'object') return fallback
  const obj = raw as Record<string, unknown>

  return {
    sourceType: typeof obj.sourceType === 'string' ? obj.sourceType.substring(0, 50) : 'UNKNOWN',
    credibilitySignal: typeof obj.credibilitySignal === 'string' ? obj.credibilitySignal.substring(0, 20) : 'UNKNOWN',
    domainTrusted: typeof obj.domainTrusted === 'boolean' ? obj.domainTrusted : false,
    issues: Array.isArray(obj.issues) ? obj.issues.filter((i): i is string => typeof i === 'string').slice(0, 10) : [],
    explanation: typeof obj.explanation === 'string' ? obj.explanation.substring(0, 2000) : 'No explanation.',
  }
}

export function validateSimilarityScore(raw: unknown): number {
  if (typeof raw === 'number' && !isNaN(raw)) {
    return clampConfidence(raw)
  }
  return 0
}
