import { sendNotification, getUserNotifications } from '@/lib/notifications/notificationService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
    }
  },
}))

describe('Phase 8: Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    } as any
  })

  test('1. Send notification creates DB entry and emits via WebSocket', async () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValueOnce(null)
    ;(prisma.notification.create as jest.Mock).mockResolvedValueOnce({ id: 'notif_1' })

    await sendNotification({
      recipientId: 'user_1',
      type: 'COMMENT_REPLY',
      payload: { message: 'Reply' },
      postId: 'post_1'
    })

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ recipientId: 'user_1', type: 'COMMENT_REPLY' })
    }))

    expect(global.io.to).toHaveBeenCalledWith('user_user_1')
    expect(global.io.emit).toHaveBeenCalledWith('NEW_NOTIFICATION', { id: 'notif_1' })
  })

  test('2. Self-notification is ignored', async () => {
    await sendNotification({
      recipientId: 'user_1',
      type: 'POST_ACTIVITY',
      payload: { actorId: 'user_1', message: 'Comment' },
      postId: 'post_1'
    })

    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  test('3. User preferences can block notifications', async () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValueOnce({
      replies: false
    })

    await sendNotification({
      recipientId: 'user_1',
      type: 'COMMENT_REPLY',
      payload: { message: 'Reply' },
      postId: 'post_1'
    })

    expect(prisma.notification.create).not.toHaveBeenCalled()
  })
})
