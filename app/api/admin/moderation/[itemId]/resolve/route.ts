import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/admin/moderation/[itemId]/resolve
 *
 * Moderator resolves a flagged post. Human decisions ALWAYS override AI suggestions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = await params
    const body = await request.json()
    const { action, reason } = body // action: 'APPROVE' | 'REJECT'

    if (!action || !reason) {
      return NextResponse.json({ error: 'Action and reason are required' }, { status: 400 })
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { id: itemId },
      select: { id: true, communityId: true, status: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify moderator permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'SUPER_ADMIN') {
      const membership = await prisma.communityMembership.findFirst({
        where: {
          userId: session.user.id,
          communityId: post.communityId,
          role: { in: ['MODERATOR', 'COMMUNITY_ADMIN'] },
        },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Apply decision — human moderator decisions OVERRIDE AI suggestions
    if (action === 'APPROVE') {
      await prisma.post.update({
        where: { id: itemId },
        data: { status: 'PUBLISHED' },
      })

      // Log moderation action
      await prisma.moderationAction.create({
        data: {
          communityId: post.communityId,
          actorId: session.user.id,
          action: 'CONTENT_APPROVED',
          targetType: 'POST',
          targetId: itemId,
          previousState: post.status,
          newState: 'PUBLISHED',
          reason: `[MODERATOR OVERRIDE] ${reason}`,
        },
      })

      return NextResponse.json({ success: true, newStatus: 'PUBLISHED' })
    } else if (action === 'REJECT') {
      await prisma.post.update({
        where: { id: itemId },
        data: { status: 'HIDDEN' },
      })

      await prisma.moderationAction.create({
        data: {
          communityId: post.communityId,
          actorId: session.user.id,
          action: 'CONTENT_HIDDEN',
          targetType: 'POST',
          targetId: itemId,
          previousState: post.status,
          newState: 'HIDDEN',
          reason: `[MODERATOR DECISION] ${reason}`,
        },
      })

      return NextResponse.json({ success: true, newStatus: 'HIDDEN' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
