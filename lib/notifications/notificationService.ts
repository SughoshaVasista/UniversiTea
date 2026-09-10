import { prisma } from '@/lib/db/prisma'

export interface CreateNotificationOptions {
  recipientId: string
  type: 'COMMENT_REPLY' | 'POST_ACTIVITY' | 'VERIFICATION_UPDATE' | 'RECEIPT_UPDATE' | 'MODERATION_ACTION' | 'SYSTEM'
  payload: any
  postId?: string
  commentId?: string
}

export async function sendNotification(opts: CreateNotificationOptions) {
  // Prevent sending notifications to oneself (e.g. replying to own post)
  if (opts.payload?.actorId === opts.recipientId) return null

  // Check user preferences
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: opts.recipientId } })
  if (prefs) {
    if (opts.type === 'COMMENT_REPLY' && !prefs.replies) return null
    if (opts.type === 'VERIFICATION_UPDATE' && !prefs.verifications) return null
    if (opts.type === 'RECEIPT_UPDATE' && !prefs.verifications) return null
    if (opts.type === 'MODERATION_ACTION' && !prefs.moderation) return null
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId: opts.recipientId,
      type: opts.type,
      payload: JSON.stringify(opts.payload),
      postId: opts.postId,
      commentId: opts.commentId
    }
  })

  if (global.io) {
    global.io.to(`user_${opts.recipientId}`).emit('NEW_NOTIFICATION', notification)
  }

  return notification
}

export async function getUserNotifications(userId: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return notifications.map(n => ({
    ...n,
    payload: JSON.parse(n.payload)
  }))
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId },
    data: { readAt: new Date() }
  })
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() }
  })
}
