import { submitReceipt, reviewReceipt, getReceiptsForPost } from '@/lib/verification/receiptService'
import { evaluatePostVerification, updateVerificationState, getVerificationHistory } from '@/lib/verification/verificationService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    post: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    receipt: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    verificationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}))

describe('Phase 5: Receipts & Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('1. Receipt submission fails if description is too short', async () => {
    await expect(
      submitReceipt({
        postId: 'post_1',
        userId: 'usr_1',
        communityId: 'comm_1',
        type: 'SCREENSHOT',
        description: 'abc', // < 5 chars
        supportsClaim: true
      })
    ).rejects.toThrow('Description too short')
  })

  test('2. Successful receipt submission sanitizes identity (does not return internal user in getReceiptsForPost)', async () => {
    const mockReceipts = [
      { id: 'receipt_1', postId: 'post_1', type: 'SCREENSHOT', description: 'Proof', credibility: 'UNKNOWN', status: 'APPROVED', supportsClaim: true, createdAt: new Date() }
    ];
    (prisma.receipt.findMany as jest.Mock).mockResolvedValueOnce(mockReceipts);

    const receipts = await getReceiptsForPost('post_1');
    expect(receipts[0]).not.toHaveProperty('submittedById')
    expect(receipts[0]).not.toHaveProperty('submittedBy')
    expect(receipts[0].description).toBe('Proof')
  })

  test('3. Verification state updates to LIKELY with high credibility supporting evidence', async () => {
    (prisma.receipt.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'receipt_1', supportsClaim: true, credibility: 'HIGH', type: 'SCREENSHOT', status: 'APPROVED' }
    ]);
    (prisma.post.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'post_1', verificationStatus: 'UNVERIFIED', authorId: 'author_1' });

    const newState = await evaluatePostVerification('post_1')
    expect(newState).toBe('VERIFIED') // HIGH credibility supporting evidence -> VERIFIED
    expect(prisma.verificationHistory.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ newState: 'VERIFIED' })
    }))
  })

  test('4. Verification state updates to DISPUTED with conflicting evidence', async () => {
    (prisma.receipt.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'receipt_1', supportsClaim: true, credibility: 'LOW', type: 'SCREENSHOT', status: 'APPROVED' },
      { id: 'receipt_2', supportsClaim: false, credibility: 'MEDIUM', type: 'PHOTO', status: 'APPROVED' }
    ]);
    (prisma.post.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'post_1', verificationStatus: 'UNVERIFIED', authorId: 'author_1' });

    const newState = await evaluatePostVerification('post_1')
    expect(newState).toBe('DISPUTED')
  })

  test('5. Manual moderator update creates audit trail', async () => {
    (prisma.post.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'post_1', verificationStatus: 'UNVERIFIED' });

    const newState = await updateVerificationState('post_1', 'mod_1', 'FALSE', 'Moderator deemed it fake')
    
    expect(newState).toBe('FALSE')
    expect(prisma.verificationHistory.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorId: 'mod_1',
        previousState: 'UNVERIFIED',
        newState: 'FALSE',
        reason: 'Moderator deemed it fake'
      })
    }))
  })
})
