/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')

const DELTA_KEY_PATTERN = 'post:*:score'
const COUNTERS = ['score', 'upvotes', 'downvotes']

function postIdFromScoreKey(key) {
  return key.slice('post:'.length, -':score'.length)
}

async function readAndResetDelta(redis, postId) {
  const values = await Promise.all(
    COUNTERS.map((counter) => redis.getDel(`post:${postId}:${counter}`))
  )
  return {
    score: Number(values[0] || 0),
    upvotes: Number(values[1] || 0),
    downvotes: Number(values[2] || 0),
  }
}

async function restoreDelta(redis, postId, delta) {
  const transaction = redis.multi()
  for (const counter of COUNTERS) {
    if (delta[counter] !== 0) transaction.incrBy(`post:${postId}:${counter}`, delta[counter])
  }
  await transaction.exec()
}

async function flushVoteDeltas(redis, prisma) {
  const postIds = []
  for await (const key of redis.scanIterator({ MATCH: DELTA_KEY_PATTERN, COUNT: 100 })) {
    postIds.push(postIdFromScoreKey(key))
  }

  const deltas = []
  for (const postId of postIds) {
    const delta = await readAndResetDelta(redis, postId)
    if (delta.score || delta.upvotes || delta.downvotes) deltas.push({ postId, ...delta })
  }
  if (deltas.length === 0) return 0

  const params = []
  const values = deltas.map((delta, index) => {
    const offset = index * 4
    params.push(delta.postId, delta.score, delta.upvotes, delta.downvotes)
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
  }).join(', ')

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Post" AS post
       SET "score" = post."score" + delta.score,
           "upvotes" = post."upvotes" + delta.upvotes,
           "downvotes" = post."downvotes" + delta.downvotes,
           "updatedAt" = NOW()
       FROM (VALUES ${values}) AS delta(id, score, upvotes, downvotes)
       WHERE post.id = delta.id`,
      ...params
    )
  } catch (error) {
    await Promise.all(deltas.map((delta) => restoreDelta(redis, delta.postId, delta)))
    throw error
  }

  return deltas.length
}

function startVoteDeltaWorker(redisClient, intervalMs = 3000) {
  const prisma = new PrismaClient()
  const workerRedis = redisClient.duplicate()
  workerRedis.on('error', (error) => console.error('[redis:vote-worker]', error))
  workerRedis.connect()
    .then(() => flushVoteDeltas(workerRedis, prisma))
    .catch((error) => console.error('[vote-worker]', error))

  const timer = setInterval(() => {
    flushVoteDeltas(workerRedis, prisma).catch((error) => console.error('[vote-worker]', error))
  }, intervalMs)
  timer.unref?.()

  return async () => {
    clearInterval(timer)
    if (workerRedis.isOpen) await workerRedis.quit()
    await prisma.$disconnect()
  }
}

module.exports = { flushVoteDeltas, startVoteDeltaWorker }
