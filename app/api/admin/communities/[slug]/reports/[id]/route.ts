import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { resolveReport } from '@/lib/moderation/reportService'
import { requireModerator } from '@/lib/auth/rbac'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, id: string }> }
) {
  try {
    const { slug, id } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const moderator = await requireModerator(community.id)

    const body = await request.json()
    const { resolution } = body

    if (resolution !== 'RESOLVED' && resolution !== 'DISMISSED') {
      return NextResponse.json({ error: 'Invalid resolution' }, { status: 400 })
    }

    const report = await resolveReport(id, moderator.id, resolution)

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
