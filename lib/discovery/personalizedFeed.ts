import { prisma } from '@/lib/db/prisma'

export type FeedMode = 'HOME' | 'FOLLOWING' | 'NEW' | 'TRENDING'

type Candidate = any & { feedReason: string; rankScore: number }

function hoursSince(date: Date) {
  return Math.max(0.1, (Date.now() - date.getTime()) / 3_600_000)
}

function diversify(candidates: Candidate[], limit: number) {
  const remaining = [...candidates]
  const selected: Candidate[] = []
  const topicCounts = new Map<string, number>()

  while (remaining.length && selected.length < limit) {
    let bestIndex = 0
    let bestValue = Number.NEGATIVE_INFINITY

    remaining.forEach((candidate, index) => {
      const topic = candidate.tags?.[0]?.tag?.name || candidate.category || 'other'
      const sameTopicPenalty = (topicCounts.get(topic) || 0) * 3
      const sameCommunityPenalty = selected.at(-1)?.communityId === candidate.communityId ? 1.5 : 0
      const value = candidate.rankScore - sameTopicPenalty - sameCommunityPenalty

      // Breaking, verified activity can remain visible even when a topic is busy.
      const urgencyBoost = candidate.verificationStatus === 'CHECKING' ? 4 : 0
      if (value + urgencyBoost > bestValue) {
        bestValue = value + urgencyBoost
        bestIndex = index
      }
    })

    const [picked] = remaining.splice(bestIndex, 1)
    const topic = picked.tags?.[0]?.tag?.name || picked.category || 'other'
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
    selected.push(picked)
  }

  return selected
}

export async function getPersonalizedFeed({
  userId,
  mode = 'HOME',
  limit = 20,
}: {
  userId?: string
  mode?: FeedMode
  limit?: number
}) {
  const follows = userId
    ? await prisma.communityFollow.findMany({ where: { userId }, select: { communityId: true } })
    : []
  const topicFollows = userId
    ? await prisma.topicFollow.findMany({ where: { userId }, select: { tagId: true } })
    : []
  const mutes = userId
    ? await prisma.mute.findMany({ where: { userId }, select: { targetType: true, targetId: true } })
    : []

  const mutedPosts = new Set(mutes.filter((mute) => mute.targetType === 'POST').map((mute) => mute.targetId))
  const mutedCommunities = new Set(mutes.filter((mute) => mute.targetType === 'COMMUNITY').map((mute) => mute.targetId))
  const mutedTopics = new Set(mutes.filter((mute) => mute.targetType === 'TOPIC').map((mute) => mute.targetId))
  const followedCommunities = new Set(follows.map((follow) => follow.communityId))
  const followedTopics = new Set(topicFollows.map((follow) => follow.tagId))

  const where: any = {
    status: 'PUBLISHED',
    deletedAt: null,
    ...(mutedCommunities.size ? { communityId: { notIn: [...mutedCommunities] } } : {}),
    ...(mutedPosts.size ? { id: { notIn: [...mutedPosts] } } : {}),
  }

  if (mode === 'FOLLOWING') {
    where.OR = [
      ...(followedCommunities.size ? [{ communityId: { in: [...followedCommunities] } }] : []),
      ...(followedTopics.size ? [{ tags: { some: { tagId: { in: [...followedTopics] } } } }] : []),
    ]
    if (!where.OR.length) where.id = '__no_followed_content__'
  }

  const posts = await prisma.post.findMany({
    where,
    take: Math.min(Math.max(limit * 8, 40), 160),
    include: {
      anonymousIdentity: true,
      community: { select: { slug: true, name: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true, votes: true, receipts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const ranked: Candidate[] = posts.map((post: any) => {
    const age = hoursSince(post.createdAt)
    const topicIds = post.tags.map((postTag: any) => postTag.tagId)
    const followsContext = followedCommunities.has(post.communityId) || topicIds.some((id: string) => followedTopics.has(id))
    const verificationQuality = post.verificationStatus === 'VERIFIED' ? 9 : post.verificationStatus === 'CHECKING' ? 4 : post.verificationStatus === 'DISPUTED' ? -4 : 0
    const safetyScore = post.verificationStatus === 'FALSE' || post.verificationStatus === 'REMOVED' ? -20 : 0
    const engagement = post.score * 1.2 + post._count.comments * 1.6 + post._count.receipts * 1.4
    const recency = 12 / Math.pow(age, 0.7)
    const followBoost = followsContext ? 8 : 0
    const rankScore = engagement + recency + verificationQuality + safetyScore + followBoost

    let feedReason = 'New in the public community'
    if (mode === 'TRENDING') feedReason = 'Trending across public communities'
    if (mode === 'FOLLOWING' || (userId && followsContext)) feedReason = 'Because you follow this community or topic'
    if (post.verificationStatus === 'CHECKING' || post.verificationStatus === 'VERIFIED') feedReason = 'Verification activity'

    return { ...post, rankScore, feedReason }
  })

  ranked.sort((a, b) => b.rankScore - a.rankScore)
  return diversify(ranked, limit)
}
