import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { findSimilarPosts } from '@/lib/ai/similarity/similarityService'

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
    const query = searchParams.get('q')
    if (!query || query.trim().length < 5) {
      return NextResponse.json({ similar: [] })
    }

    const similar = await findSimilarPosts(query, community.id)
    return NextResponse.json({
      similar: similar.map(p => ({
        id: p.id,
        title: p.title,
        similarity: Math.round(p.score * 100),
        verificationStatus: p.verificationStatus,
        commentCount: p.commentCount,
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
