import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getOpenReports } from '@/lib/moderation/reportService'
import { requireModerator } from '@/lib/auth/rbac'

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

    // Authorization
    await requireModerator(community.id)

    const reports = await getOpenReports(community.id)

    return NextResponse.json({ reports })
  } catch (error: any) {
    if (error.message.startsWith('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
