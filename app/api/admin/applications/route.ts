import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/admin/applications
 * List all community applications (SUPER_ADMIN only).
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const applications = await prisma.communityApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: { id: true, anonymousHandle: true, createdAt: true },
        },
      },
    })

    return NextResponse.json({ applications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/applications
 * Approve or reject a community application (SUPER_ADMIN only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, action, reviewerNotes } = body

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'applicationId and action are required.' }, { status: 400 })
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'action must be APPROVE or REJECT.' }, { status: 400 })
    }

    const application = await prisma.communityApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }

    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ error: 'Application has already been processed.' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      // Check slug isn't taken (race condition guard)
      const existing = await prisma.community.findUnique({
        where: { slug: application.requestedSlug },
      })

      if (existing) {
        return NextResponse.json({ error: `Slug r/${application.requestedSlug} is already taken.` }, { status: 409 })
      }

      // Create the community and give the applicant COMMUNITY_ADMIN role
      const community = await prisma.$transaction(async (tx) => {
        const newCommunity = await tx.community.create({
          data: {
            name: application.collegeName,
            slug: application.requestedSlug,
            collegeName: application.collegeName,
            emailDomain: application.emailDomain,
            status: 'VERIFIED',
            description: application.description,
          },
        })

        // Make the applicant a COMMUNITY_ADMIN
        await tx.communityMembership.create({
          data: {
            userId: application.applicantId,
            communityId: newCommunity.id,
            role: 'COMMUNITY_ADMIN',
          },
        })

        // Update application status
        await tx.communityApplication.update({
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            reviewerNotes: reviewerNotes || null,
          },
        })

        return newCommunity
      })

      return NextResponse.json({
        success: true,
        community: {
          id: community.id,
          slug: community.slug,
          name: community.name,
        },
      })
    } else {
      // REJECT
      await prisma.communityApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewerNotes: reviewerNotes || null,
        },
      })

      return NextResponse.json({ success: true, status: 'REJECTED' })
    }
  } catch (error: any) {
    console.error('Error processing application:', error)
    return NextResponse.json({ error: 'Failed to process application.' }, { status: 500 })
  }
}
