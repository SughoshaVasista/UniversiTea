import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/communities/apply
 * Submit a community creation application.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { collegeName, requestedSlug, website, location, emailDomain, description } = body

    if (!collegeName || typeof collegeName !== 'string' || collegeName.trim().length < 3) {
      return NextResponse.json({ error: 'College name must be at least 3 characters.' }, { status: 400 })
    }

    if (!requestedSlug || typeof requestedSlug !== 'string' || requestedSlug.trim().length < 2) {
      return NextResponse.json({ error: 'Slug must be at least 2 characters.' }, { status: 400 })
    }

    // Normalize slug: lowercase, alphanumeric + hyphens only
    const normalizedSlug = requestedSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

    const { isReservedSlug } = await import('@/lib/community/slugs')
    if (isReservedSlug(normalizedSlug)) {
      return NextResponse.json({ error: `The URL slug "r/${normalizedSlug}" is reserved by the platform.` }, { status: 400 })
    }

    if (normalizedSlug.length < 2) {
      return NextResponse.json({ error: 'Slug must contain at least 2 valid characters (letters, numbers, hyphens).' }, { status: 400 })
    }

    // Check for existing community with same slug
    const existingCommunity = await prisma.community.findUnique({
      where: { slug: normalizedSlug },
    })

    if (existingCommunity) {
      return NextResponse.json({ error: `r/${normalizedSlug} is already taken.` }, { status: 409 })
    }

    // Check for pending application with same slug
    const pendingApp = await prisma.communityApplication.findFirst({
      where: {
        requestedSlug: normalizedSlug,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    })

    if (pendingApp) {
      return NextResponse.json({ error: `r/${normalizedSlug} already has a pending application.` }, { status: 409 })
    }

    // Rate limit: max 3 pending applications per user
    const userPendingCount = await prisma.communityApplication.count({
      where: {
        applicantId: session.user.id,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    })

    if (userPendingCount >= 3) {
      return NextResponse.json({ error: 'You already have 3 pending community applications.' }, { status: 429 })
    }

    const application = await prisma.communityApplication.create({
      data: {
        applicantId: session.user.id,
        collegeName: collegeName.trim(),
        requestedSlug: normalizedSlug,
        website: website?.trim() || null,
        location: location?.trim() || null,
        emailDomain: emailDomain?.trim().toLowerCase() || null,
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      requestedSlug: normalizedSlug,
    })
  } catch (error: any) {
    console.error('Error in community application:', error)
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
  }
}

/**
 * GET /api/communities/apply
 * Get the current user's community applications.
 */
export async function GET() {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await prisma.communityApplication.findMany({
      where: { applicantId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
