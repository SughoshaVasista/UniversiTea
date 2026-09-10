import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { createPost, getPostsFeed } from '@/lib/post/postService'
import { sanitizePublicIdentity } from '@/lib/identity/generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor') || undefined
    const type = searchParams.get('type') === 'HOT' ? 'HOT' : 'NEW'

    const session = await getParticipationSession()
    const feed = await getPostsFeed(community.id, type, cursor, 20, session?.user.id)
    
    // Sanitize author identities
    const sanitizedPosts = feed.posts.map((p) => {
      const post = p as any
      return {
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
        commentCount: post._count?.comments ?? 0,
        author: post.anonymousIdentity ? sanitizePublicIdentity({
          name: post.anonymousIdentity.name,
          avatar: post.anonymousIdentity.avatar
        }) : { anonymousName: 'Anonymous Student', avatar: '🎓' },
        tags: post.tags?.map((t: any) => t.tag.displayName) || []
      }
    })

    return NextResponse.json({ posts: sanitizedPosts, nextCursor: feed.nextCursor })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, category } = body

    const post = await createPost({
      userId: session.user.id,
      communityId: community.id,
      title,
      content,
      category
    })

    return NextResponse.json({ success: true, postId: post.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
