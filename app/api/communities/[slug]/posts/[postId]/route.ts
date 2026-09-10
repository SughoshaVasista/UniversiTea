import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getPostById } from '@/lib/post/postService'
import { sanitizePublicIdentity } from '@/lib/identity/generator'
import { getParticipationSession } from '@/lib/auth/participation'
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

    const session = await getParticipationSession()
    const post = await getPostById(postId, community.id, session?.user.id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const sanitizedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: post.score,
      userVote: post.votes?.[0]?.value || 0,
      canDelete: session?.user.id === post.authorId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      commentCount: post._count.comments,
      author: post.anonymousIdentity ? sanitizePublicIdentity({
        name: post.anonymousIdentity.name,
        avatar: post.anonymousIdentity.avatar
      }) : { anonymousName: 'Anonymous Student', avatar: '🎓' }
    }

    return NextResponse.json({ post: sanitizedPost })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string, postId: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })
    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    const post = await prisma.post.findFirst({ where: { id: postId, communityId: community.id, deletedAt: null }, select: { authorId: true } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== session.user.id) return NextResponse.json({ error: 'Only the author can delete this tea' }, { status: 403 })
    await prisma.post.update({ where: { id: postId }, data: { status: 'DELETED', deletedAt: new Date() } })
    if (global.io) global.io.to(`community_${community.id}`).emit('POST_DELETED', { postId })
    return NextResponse.json({ success: true, postId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not delete tea' }, { status: 500 })
  }
}
