import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getTrustProfile } from '@/lib/trust/reputationService'
import { getAbuseSignalsForUser } from '@/lib/trust/abuseService'
import { requireModerator } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, userId: string }> }
) {
  try {
    const { slug, userId } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    await requireModerator(community.id)

    const profile = await getTrustProfile(userId, community.id)
    const signals = await getAbuseSignalsForUser(userId, community.id)
    
    const events = await prisma.reputationEvent.findMany({
      where: { userId, communityId: community.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      profile,
      signals,
      events
    })
  } catch (error: any) {
    if (error.message.startsWith('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
