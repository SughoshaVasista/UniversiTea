import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getOrCreateAnonymousIdentityForThread } from '@/lib/identity/anonymousService'

export async function GET(request: NextRequest) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to obtain an anonymous identity.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const communitySlug = searchParams.get('communitySlug')
    const threadId = searchParams.get('threadId')

    if (!communitySlug || !threadId) {
      return NextResponse.json(
        { error: 'Bad Request: communitySlug and threadId are required.' },
        { status: 400 }
      )
    }

    const community = await getCommunityBySlug(communitySlug)
    if (!community) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 })
    }

    // Generate or retrieve thread-consistent identity
    const result = await getOrCreateAnonymousIdentityForThread({
      userId: session.user.id,
      communityId: community.id,
      threadId,
    })

    // Return ONLY safe public fields
    return NextResponse.json({
      success: true,
      identity: result.publicProfile,
    })
  } catch (error: unknown) {
    // Avoid logging sensitive information
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
