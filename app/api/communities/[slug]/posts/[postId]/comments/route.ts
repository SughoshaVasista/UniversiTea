import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { createComment, getCommentsForPost } from '@/lib/comment/commentService'
import { sanitizePublicIdentity } from '@/lib/identity/generator'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, postId: string }> }
) {
  try {
    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const comments = await getCommentsForPost(postId, community.id)
    const session = await getParticipationSession()
    const userVotes = session
      ? await prisma.commentVote.findMany({ where: { userId: session.user.id, commentId: { in: comments.map((comment) => comment.id) } }, select: { commentId: true, value: true } })
      : []
    const voteByComment = new Map(userVotes.map((vote) => [vote.commentId, vote.value]))
    
    const sanitizedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt.toISOString(),
      upvotes: comment.votes.filter((vote) => vote.value === 1).length,
      downvotes: comment.votes.filter((vote) => vote.value === -1).length,
      score: comment.votes.reduce((score, vote) => score + vote.value, 0),
      userVote: voteByComment.get(comment.id) || 0,
      author: comment.anonymousIdentity ? sanitizePublicIdentity({
        name: comment.anonymousIdentity.name,
        avatar: comment.anonymousIdentity.avatar
      }) : { anonymousName: 'Anonymous Student', avatar: '🎓' }
    }))

    return NextResponse.json({ comments: sanitizedComments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, postId: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, parentCommentId } = body

    const comment = await createComment({
      postId,
      userId: session.user.id,
      communityId: community.id,
      content,
      parentCommentId
    })

    return NextResponse.json({ success: true, commentId: comment.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
