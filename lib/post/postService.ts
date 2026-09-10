import { prisma } from '@/lib/db/prisma'
import { getOrCreateAnonymousIdentityForThread } from '@/lib/identity/anonymousService'
import { isDuplicateContent, checkRapidVoting } from '@/lib/trust/abuseService'
import { mergeVoteDeltas, recordVoteDelta, type VoteDelta } from '@/lib/post/voteCounter'

export interface CreatePostOptions {
  communityId: string
  userId: string
  title: string
  content: string
  category: string
}

export async function createPost({ communityId, userId, title, content, category }: CreatePostOptions) {
  // Validate basic constraints
  if (!title || title.trim().length < 3) throw new Error('Title must be at least 3 characters')
  if (!content || content.trim().length < 10) throw new Error('Content must be at least 10 characters')

  // Check for duplicate content (spam prevention)
  const isDuplicate = await isDuplicateContent(content, communityId)
  if (isDuplicate) {
    throw new Error('Similar Tea already exists recently. Please join that discussion instead.')
  }

  // ── Phase 10: AI Moderation Pipeline ──────────────────────────
  const { runModerationPipeline } = await import('@/lib/ai/moderation/moderationPipeline')
  const modDecision = await runModerationPipeline({
    text: `${title.trim()} ${content.trim()}`,
    userId,
    communityId,
    targetType: 'POST',
  })

  if (modDecision.action === 'BLOCK') {
    throw new Error(modDecision.userMessage || 'This post cannot be published.')
  }
  // ──────────────────────────────────────────────────────────────
  
  // Create a placeholder ID so we can get the identity first if needed,
  // or we can use the post ID. Wait, the identity needs a threadId. For a new post, the post IS the thread.
  // We can generate a thread ID before inserting the post, or use a CUID.
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => Math.random().toString(36).substring(2) }))
  const threadId = createId()

  const identity = await getOrCreateAnonymousIdentityForThread({
    userId,
    communityId,
    threadId,
  })

  // Determine initial status based on moderation decision
  const initialStatus = modDecision.action === 'SEND_TO_MODERATION' ? 'PENDING_REVIEW' : 'PUBLISHED'

  const post = await prisma.post.create({
    data: {
      id: threadId,
      title: title.trim(),
      content: content.trim(),
      category,
      communityId,
      authorId: userId,
      anonymousIdentityId: identity.id,
      status: initialStatus,
    },
    include: {
      anonymousIdentity: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true, votes: true } },
    },
  })

  // Process tags in background
  import('@/lib/discovery/searchService').then(({ processTagsForPost }) => {
    processTagsForPost(threadId, communityId, content)
  }).catch(console.error)

  // ── Phase 10: Async claim extraction & clustering ─────────────
  if (initialStatus === 'PUBLISHED') {
    import('@/lib/ai/claims/claimExtractionService').then(async ({ extractAndStoreClaimsForPost }) => {
      const claims = await extractAndStoreClaimsForPost(threadId, communityId, content)
      // Assign claims to clusters
      if (claims.length > 0) {
        const { assignClaimToCluster } = await import('@/lib/ai/claims/claimClusterService')
        for (const claim of claims) {
          await assignClaimToCluster(claim.id, communityId)
        }
      }
    }).catch(console.error)
  }
  // ──────────────────────────────────────────────────────────────

  if (global.io) {
    global.io.to(`community_${communityId}`).emit('NEW_POST', post)
  }

  // If sent to moderation, let the user know
  if (initialStatus === 'PENDING_REVIEW') {
    return { ...post, pendingReview: true, reviewMessage: modDecision.userMessage }
  }

  return post
}

export async function getPostsFeed(communityId: string, type: 'HOT' | 'NEW', cursor?: string, limit = 20) {
  const query: any = {
    where: { communityId, status: 'PUBLISHED', deletedAt: null },
    take: limit + 1,
    include: {
      anonymousIdentity: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
  }

  if (cursor) {
    query.cursor = { id: cursor }
  }

  if (type === 'NEW') {
    query.orderBy = { createdAt: 'desc' }
  } else if (type === 'HOT') {
    // Simple engagement ranking: score descending, then by newest
    query.orderBy = [
      { score: 'desc' },
      { createdAt: 'desc' }
    ]
  }

  const posts = await prisma.post.findMany(query)
  const freshPosts = await mergeVoteDeltas(posts)
  let nextCursor: string | undefined = undefined
  
  if (freshPosts.length > limit) {
    const nextItem = freshPosts.pop()
    nextCursor = nextItem?.id
  }

  return { posts: freshPosts, nextCursor }
}

export async function getPostById(postId: string, communityId: string) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      communityId,
      status: 'PUBLISHED',
      deletedAt: null
    },
    include: {
      anonymousIdentity: true,
      _count: { select: { comments: true } }
    }
  })

  if (!post) return post
  const [freshPost] = await mergeVoteDeltas([post])
  return freshPost
}

async function applyVoteDelta(postId: string, delta: VoteDelta) {
  if (delta.score === 0 && delta.upvotes === 0 && delta.downvotes === 0) return

  const queued = await recordVoteDelta(postId, delta)
  if (queued) return

  const operation = (amount: number) => amount > 0
    ? { increment: amount }
    : { decrement: Math.abs(amount) }
  const data: Record<string, { increment?: number; decrement?: number }> = {}
  if (delta.score) data.score = operation(delta.score)
  if (delta.upvotes) data.upvotes = operation(delta.upvotes)
  if (delta.downvotes) data.downvotes = operation(delta.downvotes)
  await prisma.post.update({ where: { id: postId }, data })
}

async function emitVoteUpdate(postId: string) {
  if (!global.io || typeof prisma.post.findUnique !== 'function') return
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, score: true, upvotes: true, downvotes: true },
  })
  if (!post) return
  const [freshPost] = await mergeVoteDeltas([post])
  global.io.to(`post_${postId}`).emit('POST_VOTE_UPDATED', freshPost)
}

export async function votePost(postId: string, userId: string, communityId: string, value: 1 | -1 | 0) {
  // First verify post exists and belongs to community
  const post = await prisma.post.findFirst({
    where: { id: postId, communityId, deletedAt: null }
  })

  if (!post) throw new Error('Post not found or unauthorized')

  // Abuse check for rapid voting
  const isSpamming = await checkRapidVoting(userId, communityId)
  if (isSpamming) {
    throw new Error('You are voting too quickly. Please slow down.')
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingVote = await tx.vote.findUnique({
      where: { postId_userId: { postId, userId } }
    })

    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await tx.vote.delete({ where: { id: existingVote.id } })
        return {
          status: 'removed' as const,
          delta: {
            score: -existingVote.value,
            upvotes: existingVote.value === 1 ? -1 : 0,
            downvotes: existingVote.value === -1 ? -1 : 0,
          },
        }
      }
      return { status: 'removed' as const, delta: { score: 0, upvotes: 0, downvotes: 0 } }
    } else {
      // Create or update vote
      if (existingVote) {
        if (existingVote.value === value) {
          return { status: 'unchanged' as const, delta: { score: 0, upvotes: 0, downvotes: 0 } }
        }
        
        await tx.vote.update({
          where: { id: existingVote.id },
          data: { value }
        })
        
        const direction = value === 1 ? 1 : -1
        const previousDirection = existingVote.value === 1 ? 1 : -1
        const delta = {
          score: (direction - previousDirection),
          upvotes: value === 1 ? 1 : -1,
          downvotes: value === -1 ? 1 : -1,
        }
        return { status: 'voted' as const, delta }
      } else {
        await tx.vote.create({
          data: { postId, userId, value }
        })

        return {
          status: 'voted' as const,
          delta: {
            score: value,
            upvotes: value === 1 ? 1 : 0,
            downvotes: value === -1 ? 1 : 0,
          },
        }
      }
    }
  })

  await applyVoteDelta(postId, result.delta)
  await emitVoteUpdate(postId)
  return { status: result.status }
}
