import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { hideContent, suspendUser } from '@/lib/moderation/actionService'
import { requireModerator } from '@/lib/auth/rbac'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const moderator = await requireModerator(community.id)

    const body = await request.json()
    const { action, targetType, targetId, reason, durationDays } = body

    if (!action || !targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'HIDE_CONTENT') {
      if (targetType !== 'POST' && targetType !== 'COMMENT') {
        return NextResponse.json({ error: 'Invalid targetType for HIDE_CONTENT' }, { status: 400 })
      }
      await hideContent(targetType, targetId, community.id, moderator.id, reason)
    } else if (action === 'SUSPEND_USER') {
      if (targetType !== 'USER') {
        return NextResponse.json({ error: 'Invalid targetType for SUSPEND_USER' }, { status: 400 })
      }
      await suspendUser(targetId, community.id, moderator.id, reason, durationDays || 7)
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
