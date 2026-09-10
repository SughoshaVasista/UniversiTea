/**
 * Phase 10 — Mock AI Provider
 *
 * A fully deterministic provider that uses regex and heuristics to simulate
 * AI analysis. Works without any API key. Ideal for development, testing,
 * and as a fallback when the real provider is unavailable.
 */

import type {
  ModerationAIProvider,
  ContentSafetyResult,
  PIIDetectionResult,
  PIIMatch,
  ClaimExtractionResult,
  ExtractedClaim,
  EvidenceAnalysisResult,
  RiskLevel,
  ModerationCategory,
  ClaimType,
} from '../types'

// ─── Patterns ─────────────────────────────────────────────────────

const PHONE_PATTERNS = [
  /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g,                    // Indian mobile
  /\b(?:\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g, // US/intl
]

const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g

const STUDENT_ID_PATTERN = /\b(?:1[A-Z]{2}\d{2}[A-Z]{2}\d{3})\b/gi // VTU-style

const AADHAAR_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g

const THREAT_KEYWORDS = [
  'kill', 'murder', 'hurt', 'attack', 'bomb', 'shoot', 'stab', 'assault',
  'beat up', 'i will hurt', 'going to hurt', 'going to kill',
]

const HARASSMENT_KEYWORDS = [
  'slut', 'whore', 'bastard', 'bitch', 'retard', 'faggot',
]

const SPAM_INDICATORS = [
  /buy\s+now/gi, /click\s+here/gi, /limited\s+offer/gi, /act\s+now/gi,
  /free\s+money/gi, /earn\s+from\s+home/gi, /\$\$\$/g,
]

const ALLEGATION_VERBS = 'stole|cheated|harassed|molested|assaulted|scammed|blackmailed|threatened|bribed|abused|raped|groped'

const ALLEGATION_ROLES = 'professor|prof|teacher|sir|mam|madam|hod|dean|principal|student|person|lecturer'

const ALLEGATION_PATTERNS = [
  // "[role] [name] [bad verb]" — e.g. "Professor Kumar stole money"
  new RegExp(`(?:${ALLEGATION_ROLES})\\s+\\w+\\s+(?:${ALLEGATION_VERBS})`, 'gi'),
  // passive: "[bad verb] by [role]" — e.g. "harassed by professor"
  new RegExp(`(?:${ALLEGATION_VERBS})\\s+by\\s+(?:${ALLEGATION_ROLES})`, 'gi'),
  // "[role] [bad verb]" — e.g. "HOD harassed students" (no name between)
  new RegExp(`(?:${ALLEGATION_ROLES})\\s+(?:${ALLEGATION_VERBS})`, 'gi'),
]

// ─── Helpers ──────────────────────────────────────────────────────

function isFalsePositiveNumber(text: string, match: string, index: number): boolean {
  // Contextual check: is this number preceded by "room", "class", "floor", "block", etc.?
  const prefix = text.substring(Math.max(0, index - 20), index).toLowerCase()
  const falsePositivePrefixes = ['room', 'class', 'floor', 'block', 'section', 'batch', 'semester', 'sem', 'year', 'rs', 'inr', '₹', 'marks', 'cgpa', 'sgpa', 'roll', 'seat']
  return falsePositivePrefixes.some(fp => prefix.includes(fp))
}

function computeAllCapsRatio(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 2)
  if (words.length === 0) return 0
  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w))
  return capsWords.length / words.length
}

// ─── Provider ─────────────────────────────────────────────────────

export class MockAIProvider implements ModerationAIProvider {
  readonly name = 'mock'
  readonly modelVersion = 'mock-v1'

  async classifyContent(text: string): Promise<ContentSafetyResult> {
    const categories: ModerationCategory[] = []
    let riskLevel: RiskLevel = 'LOW'
    const explanations: string[] = []

    const lowerText = text.toLowerCase()

    // Threat detection
    for (const keyword of THREAT_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        categories.push('THREAT')
        riskLevel = 'CRITICAL'
        explanations.push(`Possible threat keyword detected: "${keyword}"`)
        break
      }
    }

    // Harassment detection
    for (const keyword of HARASSMENT_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        categories.push('HARASSMENT')
        if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH'
        explanations.push('Possible harassment language detected.')
        break
      }
    }

    // Spam detection
    let spamHits = 0
    for (const pattern of SPAM_INDICATORS) {
      if (pattern.test(text)) spamHits++
      pattern.lastIndex = 0 // reset regex
    }
    if (spamHits >= 2 || computeAllCapsRatio(text) > 0.6) {
      categories.push('SPAM')
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
      explanations.push('Content appears to be spam.')
    }

    // Targeted allegation detection
    for (const pattern of ALLEGATION_PATTERNS) {
      pattern.lastIndex = 0
      if (pattern.test(text)) {
        categories.push('TARGETED_ALLEGATION')
        if (riskLevel === 'LOW' || riskLevel === 'MEDIUM') riskLevel = 'HIGH'
        explanations.push('Content appears to make a serious allegation about an identifiable person.')
        pattern.lastIndex = 0
        break
      }
    }

    // PII detection (quick check — detailed in detectPII)
    const piiResult = await this.detectPII(text)
    if (piiResult.hasPII) {
      categories.push('PII')
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
      explanations.push('Possible PII detected in content.')
    }

    // Prompt injection detection (for auditing — we don't actually follow injected instructions)
    if (/ignore\s+(?:all\s+)?(?:previous|prior|above|your)\s+instructions/i.test(text) ||
        /you\s+are\s+now\s+/i.test(text) ||
        /system\s*:\s*/i.test(text) ||
        /mark\s+this\s+(?:as\s+)?verified/i.test(text)) {
      explanations.push('Possible prompt injection attempt detected (safely ignored).')
    }

    if (categories.length === 0) {
      categories.push('OTHER')
    }

    return {
      riskLevel,
      categories,
      explanation: explanations.join(' ') || 'No significant safety issues detected.',
      confidence: 0.7, // Mock confidence
    }
  }

  async detectPII(text: string): Promise<PIIDetectionResult> {
    const matches: PIIMatch[] = []

    // Phone numbers
    for (const pattern of PHONE_PATTERNS) {
      let m: RegExpExecArray | null
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((m = regex.exec(text)) !== null) {
        if (!isFalsePositiveNumber(text, m[0], m.index)) {
          matches.push({
            type: 'PHONE',
            value: m[0],
            confidence: 0.85,
            startIndex: m.index,
            endIndex: m.index + m[0].length,
          })
        }
      }
    }

    // Emails
    let emailMatch: RegExpExecArray | null
    const emailRegex = new RegExp(EMAIL_PATTERN.source, EMAIL_PATTERN.flags)
    while ((emailMatch = emailRegex.exec(text)) !== null) {
      matches.push({
        type: 'EMAIL',
        value: emailMatch[0],
        confidence: 0.95,
        startIndex: emailMatch.index,
        endIndex: emailMatch.index + emailMatch[0].length,
      })
    }

    // Student IDs
    let sidMatch: RegExpExecArray | null
    const sidRegex = new RegExp(STUDENT_ID_PATTERN.source, STUDENT_ID_PATTERN.flags)
    while ((sidMatch = sidRegex.exec(text)) !== null) {
      matches.push({
        type: 'STUDENT_ID',
        value: sidMatch[0],
        confidence: 0.8,
        startIndex: sidMatch.index,
        endIndex: sidMatch.index + sidMatch[0].length,
      })
    }

    // Aadhaar
    let aadhaarMatch: RegExpExecArray | null
    const aadhaarRegex = new RegExp(AADHAAR_PATTERN.source, AADHAAR_PATTERN.flags)
    while ((aadhaarMatch = aadhaarRegex.exec(text)) !== null) {
      if (aadhaarMatch[0].replace(/[\s-]/g, '').length === 12 &&
          !isFalsePositiveNumber(text, aadhaarMatch[0], aadhaarMatch.index)) {
        matches.push({
          type: 'GOVERNMENT_ID',
          value: aadhaarMatch[0],
          confidence: 0.7,
          startIndex: aadhaarMatch.index,
          endIndex: aadhaarMatch.index + aadhaarMatch[0].length,
        })
      }
    }

    let riskLevel: RiskLevel = 'LOW'
    if (matches.length > 0) {
      const hasHighConf = matches.some(m => m.confidence >= 0.8)
      riskLevel = hasHighConf ? 'HIGH' : 'MEDIUM'
    }

    return { hasPII: matches.length > 0, matches, riskLevel }
  }

  async extractClaims(text: string): Promise<ClaimExtractionResult> {
    const claims: ExtractedClaim[] = []

    // Split into sentences
    const sentences = text
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 10)

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase()
      let claimType: ClaimType = 'NOT_VERIFIABLE'
      let confidence = 0.5

      // Question
      if (sentence.endsWith('?') || lower.startsWith('does ') || lower.startsWith('is ') || lower.startsWith('are ') || lower.startsWith('will ') || lower.startsWith('anyone know')) {
        claimType = 'QUESTION'
        confidence = 0.8
      }
      // Rumour indicators
      else if (/\b(?:apparently|heard|rumou?r|supposedly|they say|someone said|gossip)\b/i.test(sentence)) {
        claimType = 'RUMOUR'
        confidence = 0.7
      }
      // Opinion indicators
      else if (/\b(?:i think|in my opinion|imo|imho|i feel|i believe|personally)\b/i.test(sentence)) {
        claimType = 'OPINION'
        confidence = 0.75
      }
      // Prediction
      else if (/\b(?:will probably|going to|likely|expected to|planning to)\b/i.test(sentence)) {
        claimType = 'PREDICTION'
        confidence = 0.65
      }
      // Sarcasm/satire indicators
      else if (/(?:😂|🤣|lmao|lol|rofl|yeah right|sure buddy|definitely\s+(?:not|🙄))/i.test(sentence)) {
        claimType = 'SATIRE'
        confidence = 0.6
      }
      // Factual claim (default for declarative statements)
      else if (/\b(?:cancelled|announced|confirmed|scheduled|postponed|released|started|closed|opened|shifted|changed)\b/i.test(sentence)) {
        claimType = 'FACTUAL'
        confidence = 0.7
      }
      else {
        // Skip sentences that don't look like claims
        continue
      }

      claims.push({
        statement: sentence,
        claimType,
        confidence,
        originalSpan: sentence,
      })
    }

    return { claims, method: 'mock-heuristic' }
  }

  async summarizeClaim(text: string): Promise<string> {
    // Simple: return first 120 chars of the text
    return text.length > 120 ? text.substring(0, 117) + '...' : text
  }

  async analyzeEvidence(description: string, sourceUrl?: string): Promise<EvidenceAnalysisResult> {
    const issues: string[] = []
    let sourceType = 'UNKNOWN'
    let credibilitySignal = 'UNKNOWN'
    let domainTrusted = false

    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl)
        const domain = url.hostname.toLowerCase()

        // Known college domains
        const trustedDomains = ['cec.edu', 'cec.ac.in', 'vtu.ac.in']
        if (trustedDomains.some(d => domain.endsWith(d))) {
          sourceType = 'OFFICIAL_SOURCE'
          credibilitySignal = 'HIGH'
          domainTrusted = true
        } else if (domain.includes('.edu') || domain.includes('.ac.in') || domain.includes('.gov')) {
          sourceType = 'OFFICIAL_SOURCE'
          credibilitySignal = 'MEDIUM'
          domainTrusted = true
        } else if (domain.includes('twitter.com') || domain.includes('x.com') || domain.includes('instagram.com') || domain.includes('facebook.com')) {
          sourceType = 'SOCIAL_MEDIA'
          credibilitySignal = 'LOW'
          issues.push('Social media screenshots can be easily fabricated.')
        } else {
          sourceType = 'USER_CONTENT'
          credibilitySignal = 'LOW'
          issues.push('Domain not recognized as an official source.')
        }
      } catch {
        issues.push('Invalid URL format.')
      }
    } else {
      issues.push('No source URL provided.')
      if (description.toLowerCase().includes('screenshot')) {
        sourceType = 'USER_CONTENT'
        issues.push('Screenshots are user-submitted evidence and require verification.')
      }
    }

    return {
      sourceType,
      credibilitySignal,
      domainTrusted,
      issues,
      explanation: issues.length > 0 ? issues.join(' ') : 'Evidence appears reasonable.',
    }
  }

  async detectSimilarity(textA: string, textB: string): Promise<number> {
    // Jaccard similarity on word tokens
    const tokenize = (t: string) => new Set(t.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean))
    const setA = tokenize(textA)
    const setB = tokenize(textB)

    if (setA.size === 0 || setB.size === 0) return 0

    let intersection = 0
    setA.forEach(token => { if (setB.has(token)) intersection++ })

    const union = new Set([...setA, ...setB]).size
    return union === 0 ? 0 : intersection / union
  }
}
