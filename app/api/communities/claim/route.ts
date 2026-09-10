import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { communitySlug, reason, proofDomain } = body

    if (!communitySlug || typeof communitySlug !== 'string') {
      return NextResponse.json({ error: 'Community slug is required.' }, { status: 400 })
    }

    const community = await prisma.community.findUnique({
      where: { slug: communitySlug.toLowerCase() },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found.' }, { status: 404 })
    }

    // Log community claim request for admin review
    console.log(`[COMMUNITY_CLAIM_REQUEST] Slug: ${community.slug} | User: ${session.user.id} | Domain: ${proofDomain}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Community claim request submitted for verification.',
        status: 'UNDER_REVIEW',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Community Claim Error]:', error)
    return NextResponse.json({ error: 'Failed to submit claim request' }, { status: 500 })
  }
}
