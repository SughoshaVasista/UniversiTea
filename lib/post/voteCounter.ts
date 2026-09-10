import { getRedisClient } from '@/lib/redis/client'

export interface VoteDelta {
  score: number
  upvotes: number
  downvotes: number
}

const counterNames = ['score', 'upvotes', 'downvotes'] as const

function key(postId: string, counter: typeof counterNames[number]) {
  return `post:${postId}:${counter}`
}

export async function recordVoteDelta(postId: string, delta: VoteDelta): Promise<boolean> {
  const redis = await getRedisClient()
  if (!redis) return false

  const transaction = redis.multi()
  for (const counter of counterNames) {
    const amount = delta[counter]
    if (amount !== 0) transaction.incrBy(key(postId, counter), amount)
  }
  await transaction.exec()
  return true
}

export async function getVoteDeltas(postIds: string[]): Promise<Map<string, VoteDelta>> {
  const result = new Map<string, VoteDelta>()
  if (postIds.length === 0) return result

  const redis = await getRedisClient()
  if (!redis) return result

  const values = await redis.mGet(
    postIds.flatMap((postId) => counterNames.map((counter) => key(postId, counter)))
  )

  postIds.forEach((postId, postIndex) => {
    const offset = postIndex * counterNames.length
    result.set(postId, {
      score: Number(values[offset] ?? 0),
      upvotes: Number(values[offset + 1] ?? 0),
      downvotes: Number(values[offset + 2] ?? 0),
    })
  })

  return result
}

export async function mergeVoteDeltas<T extends { id: string; score: number; upvotes: number; downvotes: number }>(posts: T[]): Promise<T[]> {
  const deltas = await getVoteDeltas(posts.map((post) => post.id))
  return posts.map((post) => {
    const delta = deltas.get(post.id)
    if (!delta) return post
    return {
      ...post,
      score: post.score + delta.score,
      upvotes: post.upvotes + delta.upvotes,
      downvotes: post.downvotes + delta.downvotes,
    }
  })
}
