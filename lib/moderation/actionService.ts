import { prisma } from '@/lib/db/prisma'

export async function hideContent(targetType: 'POST' | 'COMMENT', targetId: string, communityId: string, moderatorId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    let previousState = ''

    if (targetType === 'POST') {
      const post = await tx.post.findUnique({ where: { id: targetId } })
      if (!post || post.communityId !== communityId) throw new Error('Post not found or inaccessible')
      previousState = post.status
      await tx.post.update({ where: { id: targetId }, data: { status: 'HIDDEN' } })
    } else if (targetType === 'COMMENT') {
      // For comments we might just soft delete them or add a status field.
      // Currently the schema has deletedAt for comments. We'll set it.
      const comment = await tx.comment.findUnique({ where: { id: targetId }, include: { post: true } })
      if (!comment || comment.post.communityId !== communityId) throw new Error('Comment not found or inaccessible')
      previousState = comment.deletedAt ? 'DELETED' : 'PUBLISHED'
      await tx.comment.update({ where: { id: targetId }, data: { deletedAt: new Date() } })
    }

    await tx.moderationAction.create({
      data: {
        communityId,
        actorId: moderatorId,
        action: 'CONTENT_HIDDEN',
        targetType,
        targetId,
        previousState,
        newState: 'HIDDEN',
        reason
      }
    })
  })
}

export async function suspendUser(targetUserId: string, communityId: string, moderatorId: string, reason: string, durationDays: number = 7) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: targetUserId } })
    if (!user) throw new Error('User not found')

    if (user.role === 'SUPER_ADMIN') throw new Error('Cannot suspend a super admin')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    await tx.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: 'SUSPENDED',
        suspensionExpiresAt: expiresAt
      }
    })

    await tx.moderationAction.create({
      data: {
        communityId,
        actorId: moderatorId,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: targetUserId,
        previousState: user.accountStatus,
        newState: 'SUSPENDED',
        reason
      }
    })
  })
}
