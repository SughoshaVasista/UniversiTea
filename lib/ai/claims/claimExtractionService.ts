/**
 * Phase 10 — Claim Extraction Service
 *
 * Extracts structured claims from post content using the AI provider.
 * Claims are stored separately from the original post text.
 * Runs asynchronously after post creation (non-blocking).
 *
 * IMPORTANT: extraction confidence only, NOT truth confidence.
 */

import { getAIProvider } from '../provider'
import { validateClaimExtractionResult } from '../validation/outputValidator'
import { prisma } from '@/lib/db/prisma'

export async function extractAndStoreClaimsForPost(postId: string, communityId: string, content: string) {
  try {
    const ai = getAIProvider()
    const raw = await ai.extractClaims(content)
    const result = validateClaimExtractionResult(raw)

    if (result.claims.length === 0) return []

    const created = []
    for (const claim of result.claims) {
      const record = await prisma.claim.create({
        data: {
          postId,
          communityId,
          normalizedStatement: claim.statement,
          claimType: claim.claimType,
          extractionConfidence: claim.confidence,
          extractionMethod: result.method,
          status: 'EXTRACTED',
        },
      })
      created.push(record)
    }

    return created
  } catch (err) {
    // Claim extraction failure must not block post creation
    console.error('[ClaimExtraction] Failed to extract claims:', err)
    return []
  }
}

export async function getClaimsForPost(postId: string) {
  return prisma.claim.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      normalizedStatement: true,
      claimType: true,
      extractionConfidence: true,
      status: true,
      clusterId: true,
      createdAt: true,
    },
  })
}
