/**
 * Phase 10 — Similarity Service
 *
 * Finds similar recent posts in a community using token overlap + AI similarity.
 * Used for pre-publish duplicate detection ("Similar Tea already exists").
 */

import { getAIProvider } from '../provider'
import { validateSimilarityScore } from '../validation/outputValidator'
import { prisma } from '@/lib/db/prisma'

export interface SimilarPost {
  id: string
  title: string
  score: number
  verificationStatus: string
  commentCount: number
  createdAt: Date
}

export async function findSimilarPosts(
  content: string,
  communityId: string,
  limit: number = 5,
  windowHours: number = 48
): Promise<SimilarPost[]> {
  try {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000)

    const recentPosts = await prisma.post.findMany({
      where: {
        communityId,
        status: 'PUBLISHED',
        deletedAt: null,
        createdAt: { gte: windowStart },
      },
      select: {
        id: true,
        title: true,
        content: true,
        verificationStatus: true,
        createdAt: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit comparisons
    })

    if (recentPosts.length === 0) return []

    const ai = getAIProvider()
    const results: SimilarPost[] = []

    for (const post of recentPosts) {
      const rawScore = await ai.detectSimilarity(content, `${post.title} ${post.content}`)
      const score = validateSimilarityScore(rawScore)

      if (score >= 0.3) { // Minimum threshold for "similar"
        results.push({
          id: post.id,
          title: post.title,
          score,
          verificationStatus: post.verificationStatus,
          commentCount: post._count.comments,
          createdAt: post.createdAt,
        })
      }
    }

    // Sort by score descending, take top N
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch (err) {
    console.error('[SimilarityService] Failed to find similar posts:', err)
    return []
  }
}
