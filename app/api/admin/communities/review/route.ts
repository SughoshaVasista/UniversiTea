import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { communitySlug, action, reason } = body

    if (!communitySlug || !['SUSPEND', 'ARCHIVE', 'UNSUSPEND'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const newStatus = action === 'SUSPEND' ? 'SUSPENDED' : action === 'ARCHIVE' ? 'ARCHIVED' : 'VERIFIED'

    const community = await prisma.community.update({
      where: { slug: communitySlug },
      data: { status: newStatus },
    })

    console.log(`[ADMIN_COMMUNITY_STATUS_UPDATE] ${community.slug} -> ${newStatus} (Reason: ${reason || 'None'})`)

    return NextResponse.json({ success: true, communitySlug: community.slug, status: community.status }, { status: 200 })
  } catch (error) {
    console.error('[Admin Review Error]:', error)
    return NextResponse.json({ error: 'Failed to update community status' }, { status: 500 })
  }
}
