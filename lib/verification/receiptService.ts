import { prisma } from '@/lib/db/prisma'
import { logReputationEvent } from '@/lib/trust/reputationService'

export interface SubmitReceiptOptions {
  postId: string
  userId: string
  communityId: string
  type: string
  description: string
  sourceUrl?: string
  storageKey?: string
  supportsClaim: boolean
}

export async function submitReceipt({ 
  postId, 
  userId, 
  communityId, 
  type, 
  description, 
  sourceUrl, 
  storageKey, 
  supportsClaim 
}: SubmitReceiptOptions) {
  // Validate basic constraints
  if (!description || description.trim().length < 5) throw new Error('Description too short')
  
  // Verify post belongs to community
  const post = await prisma.post.findFirst({
    where: { id: postId, communityId, deletedAt: null }
  })
  if (!post) throw new Error('Post not found or unauthorized')

  // Check if user already submitted a receipt for this post to prevent corroboration farming
  const existingReceipt = await prisma.receipt.findFirst({
    where: { postId, submittedById: userId }
  })

  if (existingReceipt) {
    throw new Error('You have already submitted a receipt for this Tea.')
  }

  return prisma.receipt.create({
    data: {
      postId,
      submittedById: userId,
      type,
      description: description.trim(),
      sourceUrl,
      storageKey,
      supportsClaim,
      status: 'PENDING_REVIEW',
      credibility: 'UNKNOWN'
    }
  })
}

export async function getReceiptsForPost(postId: string) {
  // Retrieve receipts, hiding submittedBy details.
  // In a real app we might only show APPROVED ones, but we'll return all
  // and let the UI handle showing PENDING_REVIEW based on auth if we want,
  // or just return APPROVED for public.
  const receipts = await prisma.receipt.findMany({
    where: { postId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      postId: true,
      type: true,
      description: true,
      sourceUrl: true,
      storageKey: true,
      credibility: true,
      status: true,
      supportsClaim: true,
      createdAt: true,
      // Deliberately omitting submittedBy
    }
  })
  
  return receipts
}

// Admin / Moderator action
export async function reviewReceipt(receiptId: string, moderatorId: string, status: 'APPROVED' | 'REJECTED' | 'REMOVED', credibility: string) {
  const receipt = await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status,
      credibility
    },
    include: { post: true }
  })

  // Log reputation event based on moderator action
  if (status === 'APPROVED') {
    await logReputationEvent({
      userId: receipt.submittedById,
      communityId: receipt.post.communityId,
      eventType: 'RECEIPT_APPROVED',
      pointsDelta: 10,
      targetType: 'RECEIPT',
      targetId: receipt.id
    })
  } else if (status === 'REJECTED') {
    await logReputationEvent({
      userId: receipt.submittedById,
      communityId: receipt.post.communityId,
      eventType: 'RECEIPT_REJECTED',
      pointsDelta: -10,
      targetType: 'RECEIPT',
      targetId: receipt.id
    })
  }

  // Real-time and Notification
  import('@/lib/notifications/notificationService').then(async ({ sendNotification }) => {
    await sendNotification({
      recipientId: receipt.submittedById,
      type: 'RECEIPT_UPDATE',
      payload: { message: `Your receipt was ${status.toLowerCase()}.`, receiptId: receipt.id },
      postId: receipt.postId
    })

    if (global.io) {
      global.io.to(`post_${receipt.postId}`).emit('VERIFICATION_UPDATED', receipt.postId)
    }
  }).catch(console.error)

  return receipt
}
