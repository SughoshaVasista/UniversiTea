import { prisma } from '@/lib/db/prisma'

export async function evaluatePostVerification(postId: string) {
  const receipts = await prisma.receipt.findMany({
    where: { postId, status: 'APPROVED' }
  })

  const supporting = receipts.filter(r => r.supportsClaim)
  const contradicting = receipts.filter(r => !r.supportsClaim)

  let newState = 'UNVERIFIED'

  if (supporting.length > 0 && contradicting.length > 0) {
    newState = 'DISPUTED'
  } else if (supporting.length > 0) {
    const hasHighCredibility = supporting.some(r => r.credibility === 'HIGH' || r.credibility === 'VERY_HIGH' || r.type === 'OFFICIAL_SOURCE')
    newState = hasHighCredibility ? 'VERIFIED' : 'LIKELY'
  } else if (contradicting.length > 0) {
    const hasHighCredibility = contradicting.some(r => r.credibility === 'HIGH' || r.credibility === 'VERY_HIGH' || r.type === 'OFFICIAL_SOURCE')
    newState = hasHighCredibility ? 'FALSE' : 'DISPUTED'
  }

  // Auto-update state (system action)
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (post && post.verificationStatus !== newState) {
    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: { verificationStatus: newState }
      })
      // Assuming SYSTEM actor id or just use post author as fallback if system user isn't defined
      // For this MVP we won't log automatic transitions unless we have a defined system user,
      // but let's log it using a placeholder "SYSTEM" id
      await tx.verificationHistory.create({
        data: {
          postId,
          actorId: post.authorId, // Fallback for MVP without a dedicated system user
          previousState: post.verificationStatus,
          newState,
          reason: 'Auto-evaluated based on approved receipts'
        }
      })
    })
  }

  return newState
}

export async function updateVerificationState(postId: string, actorId: string, newState: string, reason: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('Post not found')

  const previousState = post.verificationStatus

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: { verificationStatus: newState }
    })

    await tx.verificationHistory.create({
      data: {
        postId,
        actorId,
        previousState,
        newState,
        reason
      }
    })
  })

  return newState
}

export async function getVerificationHistory(postId: string) {
  return prisma.verificationHistory.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      previousState: true,
      newState: true,
      reason: true,
      createdAt: true,
      // Deliberately omitting actorId
    }
  })
}
