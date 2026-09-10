import { prisma } from '@/lib/db/prisma'
import { getOrCreateAnonymousIdentityForThread } from '@/lib/identity/anonymousService'

export interface CreateCommentOptions {
  postId: string
  userId: string
  communityId: string
  content: string
  parentCommentId?: string
}

export async function createComment({ postId, userId, communityId, content, parentCommentId }: CreateCommentOptions) {
  if (!content || content.trim().length < 1) throw new Error('Content cannot be empty')

  // Verify post exists and is in the community
  const post = await prisma.post.findFirst({
    where: { id: postId, communityId, deletedAt: null }
  })

  if (!post) throw new Error('Post not found or unauthorized')

  // Get anonymous identity for this user in this thread (post)
  const identity = await getOrCreateAnonymousIdentityForThread({
    userId,
    communityId,
    threadId: postId,
  })

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      authorId: userId,
      anonymousIdentityId: identity.id,
      parentCommentId,
    },
    include: {
      anonymousIdentity: true,
      votes: { select: { value: true } },
    }
  })

  // Notifications and Real-time
  import('@/lib/notifications/notificationService').then(async ({ sendNotification }) => {
    // 1. Send Notification
    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentCommentId } })
      if (parent) {
        await sendNotification({
          recipientId: parent.authorId,
          type: 'COMMENT_REPLY',
          payload: { message: `${identity.name} replied to your comment.`, commentId: comment.id },
          postId,
          commentId: comment.id
        })
      }
    } else {
      await sendNotification({
        recipientId: post.authorId,
        type: 'POST_ACTIVITY',
        payload: { message: `${identity.name} commented on your Tea.`, commentId: comment.id },
        postId,
        commentId: comment.id
      })
    }

    // 2. Real-time Event
    if (global.io) {
      global.io.to(`post_${postId}`).emit('NEW_COMMENT', comment)
    }
  }).catch(console.error)

  return comment
}

export async function getCommentsForPost(postId: string, communityId: string) {
  // Verify post
  const post = await prisma.post.findFirst({
    where: { id: postId, communityId, deletedAt: null }
  })

  if (!post) throw new Error('Post not found')

  // Fetch all comments for this post
  const comments = await prisma.comment.findMany({
    where: { postId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      anonymousIdentity: true,
      votes: { select: { value: true } }
    }
  })

  // We can build a tree structure or just return flat for now.
  // Returning flat and letting frontend or a utility function build the tree.
  return comments
}

export async function voteComment(commentId: string, userId: string, postId: string, value: 1 | -1 | 0) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId, deletedAt: null },
    select: { id: true },
  })
  if (!comment) throw new Error('Comment not found or unauthorized')

  return prisma.$transaction(async (tx) => {
    const existing = await tx.commentVote.findUnique({ where: { commentId_userId: { commentId, userId } } })
    if (value === 0) {
      if (existing) await tx.commentVote.delete({ where: { id: existing.id } })
    } else if (existing) {
      await tx.commentVote.update({ where: { id: existing.id }, data: { value } })
    } else {
      await tx.commentVote.create({ data: { commentId, userId, value } })
    }

    const votes = await tx.commentVote.findMany({ where: { commentId }, select: { value: true } })
    const upvotes = votes.filter((vote) => vote.value === 1).length
    const downvotes = votes.filter((vote) => vote.value === -1).length
    return { upvotes, downvotes, score: upvotes - downvotes, userVote: value }
  })
}
