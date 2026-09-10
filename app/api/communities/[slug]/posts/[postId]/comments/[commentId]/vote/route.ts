import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { voteComment } from '@/lib/comment/commentService'

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string; postId: string; commentId: string }> }) {
  const session = await getParticipationSession()
  if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })

  try {
    const { slug, postId, commentId } = await params
    const community = await getCommunityBySlug(slug)
    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    const { value } = await request.json()
    if (![1, -1, 0].includes(value)) return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 })
    const result = await voteComment(commentId, session.user.id, postId, value)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not vote' }, { status: 400 })
  }
}
