import { logReputationEvent, getTrustProfile } from '@/lib/trust/reputationService'
import { checkRapidVoting, isDuplicateContent, flagAbuseSignal } from '@/lib/trust/abuseService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    reputationEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    communityTrustProfile: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    abuseSignal: {
      create: jest.fn(),
    },
    vote: {
      count: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}))

describe('Phase 7: Trust, Reputation & Anti-Manipulation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('1. New user gets NEW trust profile', async () => {
    (prisma.communityTrustProfile.findUnique as jest.Mock).mockResolvedValueOnce(null)
    
    await getTrustProfile('user_1', 'comm_1')
    
    expect(prisma.communityTrustProfile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'NEW', trustScore: 0 })
    }))
  })

  test('2. Positive reputation events increase trust and update status', async () => {
    (prisma.reputationEvent.findMany as jest.Mock).mockResolvedValueOnce([
      { pointsDelta: 10 },
      { pointsDelta: 10 },
      { pointsDelta: 40 }
    ])

    await logReputationEvent({
      userId: 'user_1',
      communityId: 'comm_1',
      eventType: 'RECEIPT_APPROVED',
      pointsDelta: 10
    })

    expect(prisma.communityTrustProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        trustScore: 60,
        status: 'ESTABLISHED'
      })
    }))
  })

  test('3. Negative events lower trust and flag user', async () => {
    (prisma.reputationEvent.findMany as jest.Mock).mockResolvedValueOnce([
      { pointsDelta: -10 },
      { pointsDelta: -20 }
    ])

    await logReputationEvent({
      userId: 'user_1',
      communityId: 'comm_1',
      eventType: 'SPAM_DETECTED',
      pointsDelta: -10
    })

    expect(prisma.communityTrustProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        trustScore: -30,
        status: 'FLAGGED'
      })
    }))
  })

  test('4. Rapid voting flags abuse signal', async () => {
    (prisma.vote.count as jest.Mock).mockResolvedValueOnce(15) // > 10

    const isSpam = await checkRapidVoting('user_1', 'comm_1')

    expect(isSpam).toBe(true)
    expect(prisma.abuseSignal.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ signalType: 'RAPID_VOTING', severity: 'HIGH' })
    }))
  })

  test('5. Duplicate content detection blocks heavily similar text', async () => {
    const existingContent = "Did you hear that Professor Smith is retiring next month? It was announced today."
    const newContent = "Did you hear Professor Smith is retiring next month It was announced today"
    
    ;(prisma.post.findMany as jest.Mock).mockResolvedValueOnce([
      { title: "News", content: existingContent }
    ])

    const isDuplicate = await isDuplicateContent(newContent, 'comm_1')
    expect(isDuplicate).toBe(true)
  })

  test('6. Non-duplicate content is allowed', async () => {
    ;(prisma.post.findMany as jest.Mock).mockResolvedValueOnce([
      { title: "News", content: "Something completely different about the campus." }
    ])

    const isDuplicate = await isDuplicateContent("Did you hear Professor Smith is retiring", 'comm_1')
    expect(isDuplicate).toBe(false)
  })
})
