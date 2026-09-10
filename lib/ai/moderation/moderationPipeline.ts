/**
 * Phase 10 — Content Moderation Pipeline
 *
 * The main orchestrator for content moderation. When content is submitted:
 * 1. Validate input
 * 2. Apply deterministic safety rules (free, fast)
 * 3. Check rate limits
 * 4. Perform AI analysis (if deterministic rules don't resolve)
 * 5. Combine signals
 * 6. Decide: ALLOW / ALLOW_WITH_FLAG / SEND_TO_MODERATION / BLOCK
 *
 * AI output is treated as a SIGNAL, never a final verdict.
 */

import crypto from 'crypto'
import { getAIProvider } from '../provider'
import { validateContentSafetyResult, validatePIIDetectionResult } from '../validation/outputValidator'
import type {
  ModerationDecision,
  ModerationSignal,
  ModerationDecisionAction,
  RiskLevel,
  ModerationCategory,
  ContentSafetyResult,
  PIIDetectionResult,
} from '../types'
import { prisma } from '@/lib/db/prisma'

// ─── Rate limit (simple in-memory, per-process) ──────────────────

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_ANALYSES = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX_ANALYSES
}

// ─── Content hash for caching ────────────────────────────────────

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

// ─── Cache check ─────────────────────────────────────────────────

async function getCachedAnalysis(contentHash: string, analysisType: string, communityId: string) {
  try {
    const cached = await prisma.aIAnalysis.findFirst({
      where: {
        contentHash,
        analysisType,
        communityId,
        // Only use cache from last 24 hours
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })
    return cached
  } catch {
    return null
  }
}

// ─── Store analysis ──────────────────────────────────────────────

async function storeAnalysis(opts: {
  targetType: string
  targetId: string
  communityId: string
  analysisType: string
  provider: string
  modelVersion: string
  result: object
  riskLevel: RiskLevel
  categories: ModerationCategory[]
  contentHash: string
}) {
  try {
    await prisma.aIAnalysis.create({
      data: {
        targetType: opts.targetType,
        targetId: opts.targetId,
        communityId: opts.communityId,
        analysisType: opts.analysisType,
        provider: opts.provider,
        modelVersion: opts.modelVersion,
        resultJson: JSON.stringify(opts.result),
        riskLevel: opts.riskLevel,
        categories: opts.categories.join(','),
        contentHash: opts.contentHash,
      },
    })
  } catch (err) {
    console.error('[ModerationPipeline] Failed to store analysis:', err)
  }
}

// ─── Main pipeline ───────────────────────────────────────────────

export interface ModerationInput {
  text: string
  userId: string
  communityId: string
  targetType: 'POST' | 'COMMENT' | 'RECEIPT'
  targetId?: string // May not exist yet for new posts
}

export async function runModerationPipeline(input: ModerationInput): Promise<ModerationDecision> {
  const signals: ModerationSignal[] = []
  const { text, userId, communityId, targetType } = input

  // ── 1. Input validation ──────────────────────────────────────
  if (!text || text.trim().length === 0) {
    return {
      action: 'BLOCK',
      signals: [],
      userMessage: 'Content cannot be empty.',
    }
  }

  // ── 2. Rate limit ────────────────────────────────────────────
  if (checkRateLimit(userId)) {
    return {
      action: 'BLOCK',
      signals: [],
      userMessage: 'You are submitting content too quickly. Please slow down.',
    }
  }

  // ── 3. Deterministic checks (free, fast) ─────────────────────
  const contentHash = hashContent(text)

  // Check cache first
  const cached = await getCachedAnalysis(contentHash, 'CONTENT_SAFETY', communityId)
  let safetyResult: ContentSafetyResult
  let piiResult: PIIDetectionResult

  if (cached) {
    // Use cached result
    const parsed = JSON.parse(cached.resultJson)
    safetyResult = validateContentSafetyResult(parsed.safety)
    piiResult = validatePIIDetectionResult(parsed.pii)
  } else {
    // ── 4. AI analysis ───────────────────────────────────────────
    const ai = getAIProvider()

    try {
      const [rawSafety, rawPII] = await Promise.all([
        ai.classifyContent(text),
        ai.detectPII(text),
      ])

      safetyResult = validateContentSafetyResult(rawSafety)
      piiResult = validatePIIDetectionResult(rawPII)

      // Store analysis for auditing and caching
      const targetId = input.targetId || 'pending'
      await storeAnalysis({
        targetType,
        targetId,
        communityId,
        analysisType: 'CONTENT_SAFETY',
        provider: ai.name,
        modelVersion: ai.modelVersion,
        result: { safety: safetyResult, pii: piiResult },
        riskLevel: safetyResult.riskLevel,
        categories: safetyResult.categories,
        contentHash,
      })
    } catch (err) {
      console.error('[ModerationPipeline] AI analysis failed, allowing content:', err)
      // AI failure → allow content (don't block legitimate posts because AI failed)
      return {
        action: 'ALLOW',
        signals: [{
          source: 'AI',
          category: 'OTHER',
          riskLevel: 'LOW',
          explanation: 'AI analysis unavailable; content allowed by default.',
        }],
      }
    }
  }

  // ── 5. Build signals ─────────────────────────────────────────

  for (const category of safetyResult.categories) {
    if (category !== 'OTHER' || safetyResult.riskLevel !== 'LOW') {
      signals.push({
        source: 'AI',
        category,
        riskLevel: safetyResult.riskLevel,
        explanation: safetyResult.explanation,
      })
    }
  }

  if (piiResult.hasPII) {
    const piiTypes = piiResult.matches.map(m => m.type).join(', ')
    signals.push({
      source: 'DETERMINISTIC',
      category: 'PII',
      riskLevel: piiResult.riskLevel,
      explanation: `PII detected: ${piiTypes}`,
    })
  }

  // ── 6. Decision ──────────────────────────────────────────────

  const maxRisk = getMaxRiskLevel(signals)
  let action: ModerationDecisionAction = 'ALLOW'
  let userMessage: string | undefined
  let moderatorNotes: string | undefined

  if (maxRisk === 'CRITICAL') {
    // High-confidence severe violation → block
    const hasThreat = signals.some(s => s.category === 'THREAT')
    if (hasThreat) {
      action = 'BLOCK'
      userMessage = 'This content cannot be published as it appears to contain threatening language.'
    } else {
      action = 'SEND_TO_MODERATION'
      userMessage = 'This post needs a quick moderation review before it can be published.'
      moderatorNotes = signals.map(s => `[${s.source}] ${s.category}: ${s.explanation}`).join('\n')
    }
  } else if (maxRisk === 'HIGH') {
    const hasAllegation = signals.some(s => s.category === 'TARGETED_ALLEGATION')
    const hasPII = signals.some(s => s.category === 'PII')

    if (hasAllegation || hasPII) {
      action = 'SEND_TO_MODERATION'
      userMessage = hasPII
        ? 'This post appears to contain personal information and needs a quick review.'
        : 'This post needs a quick moderation review before it can be published.'
      moderatorNotes = signals.map(s => `[${s.source}] ${s.category}: ${s.explanation}`).join('\n')
    } else {
      action = 'ALLOW_WITH_FLAG'
      moderatorNotes = signals.map(s => `[${s.source}] ${s.category}: ${s.explanation}`).join('\n')
    }
  } else if (maxRisk === 'MEDIUM') {
    action = 'ALLOW_WITH_FLAG'
    moderatorNotes = signals.map(s => `[${s.source}] ${s.category}: ${s.explanation}`).join('\n')
  } else {
    action = 'ALLOW'
  }

  return { action, signals, userMessage, moderatorNotes }
}

// ─── Helpers ─────────────────────────────────────────────────────

const RISK_ORDER: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function getMaxRiskLevel(signals: ModerationSignal[]): RiskLevel {
  if (signals.length === 0) return 'LOW'
  let max = 0
  for (const s of signals) {
    const idx = RISK_ORDER.indexOf(s.riskLevel)
    if (idx > max) max = idx
  }
  return RISK_ORDER[max]
}
