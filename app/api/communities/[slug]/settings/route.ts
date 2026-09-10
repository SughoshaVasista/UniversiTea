import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const community = await prisma.community.findUnique({
      where: { slug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Verify Community Admin or Super Admin role
    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    const isSuperAdmin = (session.user as any)?.role === 'SUPER_ADMIN'
    const isCommAdmin = membership?.role === 'COMMUNITY_ADMIN'

    if (!isSuperAdmin && !isCommAdmin) {
      return NextResponse.json({ error: 'Forbidden: Community Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { description } = body

    const updated = await prisma.community.update({
      where: { slug },
      data: {
        description: typeof description === 'string' ? description.trim() : community.description,
      },
    })

    return NextResponse.json({ success: true, community: updated }, { status: 200 })
  } catch (error) {
    console.error('[Community Settings Error]:', error)
    return NextResponse.json({ error: 'Failed to update community settings' }, { status: 500 })
  }
}
