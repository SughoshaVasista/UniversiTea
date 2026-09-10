import crypto from 'crypto'
import { ANONYMOUS_PERSONAS, AnonymousPersona } from './personas'

const IDENTITY_SECRET =
  process.env.SESSION_SECRET || 'universitea-anonymous-identity-secret-2026'

/**
 * Derives a deterministic 32-bit integer seed for a (userId, threadId) pair
 * using a keyed SHA-256 HMAC.
 *
 * Properties:
 * 1. Same user + same thread = identical seed.
 * 2. Same user + different thread = pseudorandomly uncorrelated seed (cross-thread unlinkability).
 * 3. Two different users in the same thread = completely uncorrelated seeds.
 * 4. Never incorporates email, name, or student PII.
 */
export function deriveThreadSeed(userId: string, threadId: string): number {
  const hmac = crypto.createHmac('sha256', IDENTITY_SECRET)
  hmac.update(`${userId}:${threadId}`)
  const hashBuffer = hmac.digest()
  return hashBuffer.readUInt32BE(0)
}

/**
 * Selects an anonymous persona for a user in a specific thread.
 * Guarantees that active participants in the same thread receive distinct personas
 * (no duplicate Pandas or Penguins in the same thread conversation).
 *
 * @param userId - Internal private user identifier
 * @param threadId - Scoped post or thread identifier
 * @param assignedNamesInThread - Names already taken by other participants in this thread
 */
export function selectPersonaForThread(
  userId: string,
  threadId: string,
  assignedNamesInThread: string[] = []
): AnonymousPersona {
  const taken = new Set(assignedNamesInThread)
  const available = ANONYMOUS_PERSONAS.filter((p) => !taken.has(p.name))

  const seed = deriveThreadSeed(userId, threadId)

  if (available.length > 0) {
    const index = seed % available.length
    return available[index]
  }

  // Fallback if thread exceeds the base persona pool size (>60 unique commenters):
  // We deterministically add a distinct modifier while still keeping the format clean
  // and avoiding sequential IDs or personal data.
  const MODIFIERS = ['Amber', 'Golden', 'Swift', 'Gentle', 'Cosmic', 'Midnight', 'Solar', 'Velvet']
  const basePersona = ANONYMOUS_PERSONAS[seed % ANONYMOUS_PERSONAS.length]
  const modifier = MODIFIERS[(seed >>> 8) % MODIFIERS.length]

  return {
    name: `Anonymous ${modifier} ${basePersona.name.replace('Anonymous ', '')}`,
    avatar: basePersona.avatar,
    color: basePersona.color,
  }
}

export interface SafePublicIdentity {
  anonymousName: string
  avatar: string
}

/**
 * Sanitizes any identity object so that ONLY safe public fields are returned.
 * Strictly guarantees that internal IDs (userId, communityId, database keys)
 * are NEVER returned to client payloads or public APIs.
 */
export function sanitizePublicIdentity(identity: {
  name: string
  avatar: string
}): SafePublicIdentity {
  return {
    anonymousName: identity.name,
    avatar: identity.avatar,
  }
}
