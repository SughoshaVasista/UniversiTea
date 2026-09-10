import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { updateVerificationState } from '@/lib/verification/verificationService'

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

    // In a real app, verify that the user is a moderator.
    // For this MVP, we assume any authenticated user within the community can mock a moderation action for demonstration purposes,
    // or we'd restrict it based on roles.

    const body = await request.json()
    const { newState, reason } = body

    if (!newState || !reason) {
      return NextResponse.json({ error: 'Missing newState or reason' }, { status: 400 })
    }

    const result = await updateVerificationState(postId, session.user.id, newState, reason)

    return NextResponse.json({ success: true, newState: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
