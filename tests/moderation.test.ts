import { createReport, getOpenReports } from '@/lib/moderation/reportService'
import { hideContent, suspendUser } from '@/lib/moderation/actionService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    moderationAction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}))

describe('Phase 6: Moderation & Reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('1. Prevents duplicate OPEN reports from the same user for the same target', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'report_1' }) // Mock existing report

    await expect(
      createReport({
        communityId: 'comm_1',
        reporterId: 'user_1',
        targetType: 'POST',
        targetId: 'post_1',
        reason: 'SPAM'
      })
    ).rejects.toThrow('already reported this item')
  })

  test('2. Hiding a post sets status to HIDDEN and creates Audit Log', async () => {
    (prisma.post.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'post_1', communityId: 'comm_1', status: 'PUBLISHED' })

    await hideContent('POST', 'post_1', 'comm_1', 'mod_1', 'Violated rules')

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post_1' },
      data: { status: 'HIDDEN' }
    })
    
    expect(prisma.moderationAction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'CONTENT_HIDDEN',
        targetType: 'POST',
        targetId: 'post_1',
        previousState: 'PUBLISHED',
        newState: 'HIDDEN'
      })
    }))
  })

  test('3. Suspending a user updates account status and creates Audit Log', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'user_1', role: 'USER', accountStatus: 'ACTIVE' })

    await suspendUser('user_1', 'comm_1', 'mod_1', 'Spamming', 7)

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user_1' },
      data: expect.objectContaining({
        accountStatus: 'SUSPENDED'
      })
    }))
    
    expect(prisma.moderationAction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: 'user_1',
        previousState: 'ACTIVE',
        newState: 'SUSPENDED'
      })
    }))
  })

  test('4. Cannot suspend a SUPER_ADMIN', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin_1', role: 'SUPER_ADMIN', accountStatus: 'ACTIVE' })

    await expect(
      suspendUser('admin_1', 'comm_1', 'mod_1', 'test', 7)
    ).rejects.toThrow('Cannot suspend a super admin')
  })
})
