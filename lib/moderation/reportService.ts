import { prisma } from '@/lib/db/prisma'

export interface CreateReportOptions {
  communityId: string
  reporterId: string
  targetType: 'POST' | 'COMMENT' | 'RECEIPT'
  targetId: string
  reason: string
  description?: string
}

export async function createReport(opts: CreateReportOptions) {
  // Rate limiting & duplicate check could go here
  const existing = await prisma.report.findFirst({
    where: {
      reporterId: opts.reporterId,
      targetId: opts.targetId,
      status: 'OPEN'
    }
  })

  if (existing) {
    throw new Error('You have already reported this item and it is pending review')
  }

  return prisma.report.create({
    data: {
      communityId: opts.communityId,
      reporterId: opts.reporterId,
      targetType: opts.targetType,
      targetId: opts.targetId,
      reason: opts.reason,
      description: opts.description,
      status: 'OPEN'
    }
  })
}

export async function getOpenReports(communityId: string) {
  return prisma.report.findMany({
    where: { communityId, status: { in: ['OPEN', 'IN_REVIEW'] } },
    orderBy: { createdAt: 'asc' },
    // Optionally fetch target details, but we use explicit string IDs to avoid Prisma polymorphic issues.
    // In a real app we might join the related Post/Comment/Receipt here or fetch them concurrently.
  })
}

export async function resolveReport(reportId: string, moderatorId: string, resolution: 'RESOLVED' | 'DISMISSED') {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      status: resolution,
      reviewedAt: new Date(),
      reviewedById: moderatorId,
      resolution
    }
  })
}
