import { prisma } from '@/lib/db/prisma'

export async function getTrendingPosts(communityId: string, limit = 20) {
  // To avoid heavy DB calculations on every request in MVP, 
  // we fetch recent active posts and calculate score in JS, or use a basic DB heuristic.
  // A robust approach involves a scheduled job updating a `trendingScore` column.
  
  // For MVP: Fetch posts from the last 72 hours, then rank in JS using a time-decay heuristic.
  const windowStart = new Date(Date.now() - 72 * 60 * 60 * 1000)
  
  const recentPosts = await prisma.post.findMany({
    where: {
      communityId,
      status: 'PUBLISHED',
      deletedAt: null,
      createdAt: { gte: windowStart }
    },
    include: {
      anonymousIdentity: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true, votes: true } }
    },
    take: 100 // Grab up to 100 candidates to rank
  })

  // Trending Heuristic:
  // (Votes * 1.5) + (Comments * 2) - (HoursSincePublished ^ 1.5)
  // This heavily favors recent engagement.
  const now = Date.now()

  const rankedPosts = recentPosts.map(post => {
    const hoursSincePublished = Math.max(0.1, (now - post.createdAt.getTime()) / (1000 * 60 * 60))
    const voteWeight = post.score * 1.5
    const commentWeight = post._count.comments * 2.0
    const agePenalty = Math.pow(hoursSincePublished, 1.5)
    
    // Slight boost for verification activity
    let verificationBoost = 0
    if (post.verificationStatus === 'VERIFIED') verificationBoost = 5
    if (post.verificationStatus === 'CHECKING') verificationBoost = 2

    const trendingScore = voteWeight + commentWeight + verificationBoost - agePenalty

    return { ...post, trendingScore }
  })

  rankedPosts.sort((a, b) => b.trendingScore - a.trendingScore)

  return rankedPosts.slice(0, limit)
}
