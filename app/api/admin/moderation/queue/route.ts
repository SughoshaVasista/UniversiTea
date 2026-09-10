import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/admin/moderation/queue
 *
 * Returns items flagged for moderation review, prioritized by AI risk level.
 * Only accessible to SUPER_ADMIN and COMMUNITY_ADMIN/MODERATOR users.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin/moderator
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      // Also check community memberships for moderator role
      const modMemberships = await prisma.communityMembership.findMany({
        where: {
          userId: session.user.id,
          role: { in: ['MODERATOR', 'COMMUNITY_ADMIN'] },
        },
        select: { communityId: true },
      })

      if (modMemberships.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    // Get posts pending review
    const where: any = { status: 'PENDING_REVIEW' }
    if (communityId) where.communityId = communityId

    const pendingPosts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        communityId: true,
        createdAt: true,
        anonymousIdentity: {
          select: { name: true, avatar: true },
        },
      },
    })

    // Get AI analysis for these posts
    const postIds = pendingPosts.map(p => p.id)
    const analyses = await prisma.aIAnalysis.findMany({
      where: {
        targetId: { in: postIds },
        targetType: 'POST',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build queue items
    const queue = pendingPosts.map(post => {
      const analysis = analyses.find(a => a.targetId === post.id)
      let aiAssist = null

      if (analysis) {
        try {
          const result = JSON.parse(analysis.resultJson)
          aiAssist = {
            riskLevel: analysis.riskLevel,
            categories: analysis.categories.split(',').filter(Boolean),
            explanation: result?.safety?.explanation || 'No details available.',
            provider: analysis.provider,
            modelVersion: analysis.modelVersion,
            analyzedAt: analysis.createdAt.toISOString(),
          }
        } catch {
          // Malformed analysis — skip
        }
      }

      return {
        id: post.id,
        title: post.title,
        content: post.content.substring(0, 300),
        category: post.category,
        communityId: post.communityId,
        createdAt: post.createdAt.toISOString(),
        author: post.anonymousIdentity
          ? { name: post.anonymousIdentity.name, avatar: post.anonymousIdentity.avatar }
          : { name: 'Anonymous Student', avatar: '🎓' },
        aiAssist,
      }
    })

    // Sort: CRITICAL first, then HIGH, then MEDIUM, then LOW
    const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    queue.sort((a, b) => {
      const riskA = riskOrder[a.aiAssist?.riskLevel || 'LOW'] ?? 4
      const riskB = riskOrder[b.aiAssist?.riskLevel || 'LOW'] ?? 4
      return riskA - riskB
    })

    return NextResponse.json({ queue, total: queue.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
