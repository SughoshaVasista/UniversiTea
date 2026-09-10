import { getSession } from './getSession'
import { prisma } from '@/lib/db/prisma'

export async function requireModerator(communityId: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  // Super admins always have access
  if (session.user.role === 'SUPER_ADMIN') return session.user

  // Check community-level membership role
  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: session.user.id,
        communityId,
      },
    },
  })

  if (!membership || (membership.role !== 'MODERATOR' && membership.role !== 'COMMUNITY_ADMIN')) {
    throw new Error('Forbidden: Requires moderator role in this community')
  }

  return session.user
}
