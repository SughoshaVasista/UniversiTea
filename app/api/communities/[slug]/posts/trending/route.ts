import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getTrendingPosts } from '@/lib/discovery/trendingService'
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

    const posts = await getTrendingPosts(community.id, 20)

    const sanitizedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      verificationStatus: post.verificationStatus,
      score: post.score,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      createdAt: post.createdAt.toISOString(),
      commentsCount: (post as any)._count.comments,
      author: post.anonymousIdentity ? sanitizePublicIdentity({
        name: post.anonymousIdentity.name,
        avatar: post.anonymousIdentity.avatar
      }) : { anonymousName: 'Anonymous Student', avatar: '🎓' },
      tags: post.tags?.map((t: any) => t.tag.displayName) || []
    }))

    return NextResponse.json({ posts: sanitizedPosts, nextCursor: null })
  } catch (error: any) {
    console.error('Trending fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch trending posts' }, { status: 500 })
  }
}
