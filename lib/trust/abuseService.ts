import { prisma } from '@/lib/db/prisma'

export async function flagAbuseSignal(userId: string, communityId: string, signalType: string, severity: string) {
  return prisma.abuseSignal.create({
    data: {
      userId,
      communityId,
      signalType,
      severity
    }
  })
}

// 1. Check for rapid voting (e.g. > 10 votes in the last 1 minute)
export async function checkRapidVoting(userId: string, communityId: string) {
  const oneMinuteAgo = new Date(Date.now() - 60000)
  
  const recentVotes = typeof prisma.vote?.count === 'function'
    ? await prisma.vote.count({
        where: {
          userId,
          post: { communityId },
          createdAt: { gte: oneMinuteAgo }
        }
      })
    : 0

  if (recentVotes > 10) {
    await flagAbuseSignal(userId, communityId, 'RAPID_VOTING', 'HIGH')
    return true
  }
  return false
}

// 2. Check for duplicate content using a simple similarity heuristic (Jaccard-like or token overlap)
export async function isDuplicateContent(content: string, communityId: string): Promise<boolean> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  
  const recentPosts = await prisma.post.findMany({
    where: {
      communityId,
      createdAt: { gte: twoHoursAgo }
    },
    select: { title: true, content: true }
  })

  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean)
  const newTokens = new Set(normalize(content))

  if (newTokens.size < 5) return false // Too short to effectively compare

  for (const post of recentPosts) {
    const existingTokens = new Set([...normalize(post.title), ...normalize(post.content)])
    
    let overlap = 0
    newTokens.forEach(t => {
      if (existingTokens.has(t)) overlap++
    })

    const similarity = overlap / Math.max(newTokens.size, existingTokens.size)
    
    // If more than 75% similarity, flag as duplicate
    if (similarity > 0.75) {
      return true
    }
  }

  return false
}

export async function getAbuseSignalsForUser(userId: string, communityId: string) {
  return prisma.abuseSignal.findMany({
    where: { userId, communityId },
    orderBy: { createdAt: 'desc' }
  })
}
