import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { createReport } from '@/lib/moderation/reportService'

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
    const { targetType, targetId, reason, description } = body

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const report = await createReport({
      communityId: community.id,
      reporterId: session.user.id,
      targetType,
      targetId,
      reason,
      description
    })

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
