import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { votePost } from '@/lib/post/postService'

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
    const { value } = body
    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
    }

    const result = await votePost(postId, session.user.id, community.id, value as 1 | -1 | 0)

    return NextResponse.json({ success: true, status: result.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
