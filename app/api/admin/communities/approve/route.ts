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
    const { applicationId, action, notes } = body

    if (!applicationId || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const application = await prisma.communityApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (action === 'APPROVE') {
      // Provision the new campus community automatically
      const community = await prisma.community.upsert({
        where: { slug: application.requestedSlug },
        update: {
          status: 'VERIFIED',
        },
        create: {
          name: application.collegeName,
          slug: application.requestedSlug,
          collegeName: application.collegeName,
          emailDomain: application.emailDomain,
          status: 'VERIFIED',
          description: application.description || `${application.collegeName} student tea room.`,
        },
      })

      await prisma.communityApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewerNotes: notes || 'Approved by Super Admin.',
        },
      })

      return NextResponse.json({ success: true, communitySlug: community.slug }, { status: 200 })
    } else {
      await prisma.communityApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewerNotes: notes || 'Rejected by Super Admin.',
        },
      })

      return NextResponse.json({ success: true, status: 'REJECTED' }, { status: 200 })
    }
  } catch (error) {
    console.error('[Community Approve Error]:', error)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}
