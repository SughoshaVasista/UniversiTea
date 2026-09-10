import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

export async function GET(
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

    const moderators = await prisma.communityMembership.findMany({
      where: {
        communityId: community.id,
        role: { in: ['MODERATOR', 'COMMUNITY_ADMIN'] },
      },
      select: {
        id: true,
        role: true,
        joinedAt: true,
      },
    })

    return NextResponse.json({ moderators }, { status: 200 })
  } catch (error) {
    console.error('[Community Moderators GET Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch moderators' }, { status: 500 })
  }
}
