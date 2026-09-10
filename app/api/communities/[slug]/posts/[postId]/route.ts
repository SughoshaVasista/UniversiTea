import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getPostById } from '@/lib/post/postService'
import { sanitizePublicIdentity } from '@/lib/identity/generator'
import { getParticipationSession } from '@/lib/auth/participation'

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
