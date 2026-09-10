import { prisma } from '@/lib/db/prisma'

export interface LogReputationEventOptions {
  userId: string
  communityId: string
  eventType: string
  pointsDelta: number
  targetType?: string
  targetId?: string
}

export async function logReputationEvent(opts: LogReputationEventOptions) {
  return prisma.$transaction(async (tx) => {
    // 1. Log the event
    await tx.reputationEvent.create({
      data: {
        userId: opts.userId,
        communityId: opts.communityId,
        eventType: opts.eventType,
        pointsDelta: opts.pointsDelta,
        targetType: opts.targetType,
        targetId: opts.targetId
      }
    })

    // 2. Calculate the new score based on recent events (decay old events or limit max)
    // For MVP, we just do a sum, but realistically we would add decay logic here.
    const allEvents = await tx.reputationEvent.findMany({
      where: { userId: opts.userId, communityId: opts.communityId },
      orderBy: { createdAt: 'desc' },
      take: 100 // only look at the last 100 events to prevent infinite accumulation
    })

    const newScore = allEvents.reduce((sum, e) => sum + e.pointsDelta, 0)

    // Determine status
    let status = 'TRUST_ESTABLISHING'
    if (newScore > 50) status = 'ESTABLISHED'
    if (newScore < -20) status = 'FLAGGED'

    // 3. Update profile
    const profile = await tx.communityTrustProfile.upsert({
      where: {
        userId_communityId: {
          userId: opts.userId,
          communityId: opts.communityId
        }
      },
      update: {
        trustScore: newScore,
        status
      },
      create: {
        userId: opts.userId,
        communityId: opts.communityId,
        trustScore: newScore,
        status
      }
    })

    return profile
  })
}

export async function getTrustProfile(userId: string, communityId: string) {
  let profile = await prisma.communityTrustProfile.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    }
  })

  if (!profile) {
    profile = await prisma.communityTrustProfile.create({
      data: {
        userId,
        communityId,
        status: 'NEW',
        trustScore: 0
      }
    })
  }
  return profile
}
