import { prisma } from '@/lib/db/prisma'
import {
  selectPersonaForThread,
  sanitizePublicIdentity,
  SafePublicIdentity,
} from './generator'

export interface GetThreadIdentityOptions {
  userId: string
  communityId: string
  threadId: string
}

/**
 * Retrieves or creates a thread-consistent anonymous identity for an authenticated user.
 *
 * Guarantees:
 * 1. Inside the same thread, the user always receives the exact same identity.
 * 2. In different threads, the user receives uncorrelated personas.
 * 3. Two different users in the same thread are never assigned the same persona.
 * 4. The user must have an active platform account; community membership is
 *    not required for public-community participation.
 */
export async function getOrCreateAnonymousIdentityForThread({
  userId,
  communityId,
  threadId,
}: GetThreadIdentityOptions): Promise<{
  id: string
  name: string
  avatar: string
  publicProfile: SafePublicIdentity
}> {
  if (!userId || !communityId || !threadId) {
    throw new Error('Missing required identity context parameters')
  }

  // 1. Verify user exists (User model has no communityId — membership is tracked via CommunityMembership)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, accountStatus: true },
  })

  if (!user) {
    throw new Error('Security Error: User not found')
  }

  if (user.accountStatus !== 'ACTIVE') {
    throw new Error('Security Error: Account is not active')
  }

  // 2. Check if identity already exists for this (userId, threadId)
  const existing = await prisma.anonymousIdentity.findUnique({
    where: {
      userId_threadId: {
        userId,
        threadId,
      },
    },
  })

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      avatar: existing.avatar,
      publicProfile: sanitizePublicIdentity(existing),
    }
  }

  // 3. Find names already assigned in this thread to avoid collisions
  const existingInThread = await prisma.anonymousIdentity.findMany({
    where: { threadId },
    select: { name: true },
  })
  const assignedNames = Array.isArray(existingInThread)
    ? existingInThread.map((item) => item.name)
    : []

  // 4. Select a persona for this user
  const persona = selectPersonaForThread(userId, threadId, assignedNames)

  // 5. Store identity in database
  const created = await prisma.anonymousIdentity.create({
    data: {
      userId,
      communityId,
      threadId,
      name: persona.name,
      avatar: persona.avatar,
    },
  })

  return {
    id: created.id,
    name: created.name,
    avatar: created.avatar,
    publicProfile: sanitizePublicIdentity(created),
  }
}

/**
 * Gets a community preview identity for a user (e.g. for showing "Posting as Anonymous Panda"
 * in navigation or community banners before entering a specific thread).
 */
export async function getCommunityPreviewIdentity(
  userId: string,
  communityId: string
): Promise<SafePublicIdentity> {
  const result = await getOrCreateAnonymousIdentityForThread({
    userId,
    communityId,
    threadId: `community_preview_${communityId}`,
  })
  return result.publicProfile
}
