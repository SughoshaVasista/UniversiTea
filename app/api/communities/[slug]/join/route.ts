import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/communities/[slug]/join
 * Join a community (creates a CommunityMembership with MEMBER role).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const community = await prisma.community.findUnique({
      where: { slug: slug.toLowerCase() },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    if (community.status !== 'VERIFIED') {
      return NextResponse.json({ error: 'This community is not active.' }, { status: 403 })
    }

    // Check if already a member
    const existing = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ success: true, status: 'ALREADY_MEMBER', role: existing.role })
    }

    const membership = await prisma.communityMembership.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({ success: true, status: 'JOINED', role: membership.role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/communities/[slug]/join
 * Leave a community (deletes the CommunityMembership).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const community = await prisma.community.findUnique({
      where: { slug: slug.toLowerCase() },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ success: true, status: 'NOT_A_MEMBER' })
    }

    if (membership.role === 'COMMUNITY_ADMIN') {
      return NextResponse.json({ error: 'Community admins cannot leave. Transfer ownership first.' }, { status: 403 })
    }

    await prisma.communityMembership.delete({
      where: { id: membership.id },
    })

    return NextResponse.json({ success: true, status: 'LEFT' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
