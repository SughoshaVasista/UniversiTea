/**
 * Phase 10 — AI Provider Abstraction Types
 *
 * All AI capabilities are defined as interfaces here.
 * Concrete providers (mock, openai, etc.) implement these.
 * No component should import a provider directly; use getAIProvider().
 */

// ─── Enums ────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ModerationCategory =
  | 'HARASSMENT'
  | 'THREAT'
  | 'DOXXING'
  | 'HATE'
  | 'SPAM'
  | 'PII'
  | 'TARGETED_ALLEGATION'
  | 'SEXUAL_PRIVATE_CONTENT'
  | 'OTHER'

export type ClaimType =
  | 'FACTUAL'
  | 'RUMOUR'
  | 'PREDICTION'
  | 'OPINION'
  | 'QUESTION'
  | 'SATIRE'
  | 'NOT_VERIFIABLE'

export type ModerationDecisionAction =
  | 'ALLOW'
  | 'ALLOW_WITH_FLAG'
  | 'SEND_TO_MODERATION'
  | 'BLOCK'

// ─── Result types ─────────────────────────────────────────────────

export interface ContentSafetyResult {
  riskLevel: RiskLevel
  categories: ModerationCategory[]
  explanation: string          // Concise, structured reason (not raw chain-of-thought)
  confidence: number           // 0–1
}

export interface PIIMatch {
  type: 'PHONE' | 'EMAIL' | 'ADDRESS' | 'STUDENT_ID' | 'GOVERNMENT_ID' | 'CREDENTIAL' | 'SENSITIVE_URL' | 'OTHER'
  value: string                // The detected fragment (may be redacted for storage)
  confidence: number           // 0–1
  startIndex: number
  endIndex: number
}

export interface PIIDetectionResult {
  hasPII: boolean
  matches: PIIMatch[]
  riskLevel: RiskLevel
}

export interface ExtractedClaim {
  statement: string            // Normalized claim text
  claimType: ClaimType
  confidence: number           // Extraction confidence, NOT truth confidence
  originalSpan?: string        // The original text span this was extracted from
}

export interface ClaimExtractionResult {
  claims: ExtractedClaim[]
  method: string               // e.g. "mock-heuristic", "gpt-4o"
}

export interface SimilarityCandidate {
  targetId: string
  score: number                // 0–1 similarity
  matchedClaims?: string[]     // Which claims overlapped
}

export interface SimilarityResult {
  candidates: SimilarityCandidate[]
}

export interface EvidenceAnalysisResult {
  sourceType: string           // OFFICIAL_SOURCE, NEWS, SOCIAL_MEDIA, USER_CONTENT, UNKNOWN
  credibilitySignal: string    // HIGH, MEDIUM, LOW, UNKNOWN
  domainTrusted: boolean
  issues: string[]             // e.g. ["Screenshot may be edited", "Domain not recognized"]
  explanation: string
}

// ─── Provider interface ───────────────────────────────────────────

export interface ModerationAIProvider {
  readonly name: string                // e.g. "mock", "openai"
  readonly modelVersion: string        // e.g. "mock-v1", "gpt-4o-2024-08"

  /**
   * Classify content for safety violations.
   * Input: raw user text. NEVER include private user data.
   */
  classifyContent(text: string): Promise<ContentSafetyResult>

  /**
   * Detect personally identifiable information in text.
   */
  detectPII(text: string): Promise<PIIDetectionResult>

  /**
   * Extract structured claims from a post's text.
   * Returns extraction confidence, NOT truth confidence.
   */
  extractClaims(text: string): Promise<ClaimExtractionResult>

  /**
   * Produce a concise normalized summary of a claim.
   */
  summarizeClaim(text: string): Promise<string>

  /**
   * Analyze submitted evidence/receipt.
   * Input: description text, optional URL. Never send user identity.
   */
  analyzeEvidence(description: string, sourceUrl?: string): Promise<EvidenceAnalysisResult>

  /**
   * Score semantic similarity between two pieces of text.
   * Returns 0–1 score.
   */
  detectSimilarity(textA: string, textB: string): Promise<number>
}

// ─── Moderation decision ──────────────────────────────────────────

export interface ModerationSignal {
  source: 'DETERMINISTIC' | 'AI'
  category: ModerationCategory
  riskLevel: RiskLevel
  explanation: string
}

export interface ModerationDecision {
  action: ModerationDecisionAction
  signals: ModerationSignal[]
  /** User-facing message (safe to show in UI) */
  userMessage?: string
  /** Internal notes for moderator dashboard */
  moderatorNotes?: string
}
