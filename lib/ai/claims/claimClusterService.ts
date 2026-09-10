/**
 * Phase 10 — Claim Cluster Service
 *
 * Groups semantically similar claims across posts in the same community.
 * Uses token overlap + AI similarity scoring.
 * Time-windowed to recent claims (48 hours).
 */

import { getAIProvider } from '../provider'
import { validateSimilarityScore } from '../validation/outputValidator'
import { prisma } from '@/lib/db/prisma'

const SIMILARITY_THRESHOLD = 0.4
const CLUSTER_WINDOW_HOURS = 48

export async function assignClaimToCluster(claimId: string, communityId: string) {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: claimId } })
    if (!claim || claim.clusterId) return // Already assigned or not found

    const windowStart = new Date(Date.now() - CLUSTER_WINDOW_HOURS * 60 * 60 * 1000)

    // Find recent claims in the same community that are already in clusters
    const recentClaims = await prisma.claim.findMany({
      where: {
        communityId,
        id: { not: claimId },
        createdAt: { gte: windowStart },
        status: { not: 'DISMISSED' },
      },
      include: { cluster: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to prevent excessive comparisons
    })

    if (recentClaims.length === 0) return

    const ai = getAIProvider()
    let bestMatch: { claimId: string; clusterId: string | null; score: number } | null = null

    for (const candidate of recentClaims) {
      const rawScore = await ai.detectSimilarity(claim.normalizedStatement, candidate.normalizedStatement)
      const score = validateSimilarityScore(rawScore)

      if (score >= SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          claimId: candidate.id,
          clusterId: candidate.clusterId,
          score,
        }
      }
    }

    if (bestMatch) {
      if (bestMatch.clusterId) {
        // Add to existing cluster
        await prisma.claim.update({
          where: { id: claimId },
          data: { clusterId: bestMatch.clusterId },
        })
      } else {
        // Create a new cluster with both claims
        const cluster = await prisma.claimCluster.create({
          data: {
            communityId,
            label: claim.normalizedStatement.substring(0, 100),
            status: 'ACTIVE',
          },
        })

        await prisma.claim.updateMany({
          where: { id: { in: [claimId, bestMatch.claimId] } },
          data: { clusterId: cluster.id },
        })
      }
    }
  } catch (err) {
    console.error('[ClaimCluster] Failed to assign claim to cluster:', err)
  }
}

export async function getClaimClusters(communityId: string, status: string = 'ACTIVE') {
  return prisma.claimCluster.findMany({
    where: { communityId, status },
    include: {
      claims: {
        select: {
          id: true,
          normalizedStatement: true,
          claimType: true,
          status: true,
          postId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { claims: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}
