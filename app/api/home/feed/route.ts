import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getPersonalizedFeed, FeedMode } from '@/lib/discovery/personalizedFeed'
import { sanitizePublicIdentity } from '@/lib/identity/generator'

export async function GET(request: NextRequest) {
  try {
    const modeParam = new URL(request.url).searchParams.get('mode')?.toUpperCase() || 'HOME'
    const mode: FeedMode = ['HOME', 'FOLLOWING', 'NEW', 'TRENDING'].includes(modeParam) ? modeParam as FeedMode : 'HOME'
    const session = await getParticipationSession()
    const posts = await getPersonalizedFeed({ userId: session?.user.id, mode: session ? mode : 'TRENDING' })

    return NextResponse.json({
      mode,
      personalized: Boolean(session),
      posts: posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        community: post.community,
        verificationStatus: post.verificationStatus,
        score: post.score,
        commentCount: post._count.comments,
        createdAt: post.createdAt.toISOString(),
        feedReason: post.feedReason,
        tags: post.tags.map((tag: any) => tag.tag.displayName),
        author: post.anonymousIdentity ? sanitizePublicIdentity(post.anonymousIdentity) : { anonymousName: 'Anonymous Student', avatar: '🎓' },
      })),
    })
  } catch (error) {
    console.error('[home/feed]', error)
    return NextResponse.json({ error: 'Failed to build feed' }, { status: 500 })
  }
}
