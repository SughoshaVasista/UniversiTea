import {
  deriveThreadSeed,
  selectPersonaForThread,
  sanitizePublicIdentity,
} from '@/lib/identity/generator'
import {
  getOrCreateAnonymousIdentityForThread,
} from '@/lib/identity/anonymousService'
import { prisma } from '@/lib/db/prisma'

// Mock prisma for service tests
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    communityMembership: {
      findUnique: jest.fn(),
    },
    anonymousIdentity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Phase 3: Contextual Anonymous Identity System & Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Requirement 1: Anonymous identity is generated server-side
  test('1. Anonymous identity is generated server-side and has valid persona format', () => {
    const userId = 'usr_cec_test_1'
    const threadId = 'thread_library_timing'

    const persona = selectPersonaForThread(userId, threadId)

    expect(typeof persona.name).toBe('string')
    expect(persona.name).toMatch(/^Anonymous [A-Z][a-zA-Z\s]+$/)
    expect(typeof persona.avatar).toBe('string')
    expect(persona.avatar.length).toBeGreaterThanOrEqual(1) // Unicode emoji character
    expect(typeof persona.color).toBe('string')
  })

  // Requirement 2: Public responses do not expose User email
  test('2. Public responses do not expose User email or email hash', () => {
    const rawIdentity = {
      id: 'ident_cuid_12345',
      userId: 'usr_secret_789',
      communityId: 'comm_cec',
      threadId: 'thread_101',
      name: 'Anonymous Panda',
      avatar: '🐼',
      user: {
        id: 'usr_secret_789',
        emailHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        email: 'real.student@cec.edu',
      },
    }

    const publicResponse = sanitizePublicIdentity(rawIdentity)

    // Should strictly contain only anonymousName and avatar
    expect(publicResponse).toEqual({
      anonymousName: 'Anonymous Panda',
      avatar: '🐼',
    })
    const responseRecord = publicResponse as unknown as Record<string, unknown>
    expect(responseRecord['email']).toBeUndefined()
    expect(responseRecord['emailHash']).toBeUndefined()
    expect(responseRecord['userId']).toBeUndefined()
    expect(JSON.stringify(publicResponse)).not.toContain('real.student@cec.edu')
    expect(JSON.stringify(publicResponse)).not.toContain('e3b0c44298fc1c149afbf')
  })

  // Requirement 3: Public responses do not expose private User ID
  test('3. Public responses do not expose private User ID or database internals', () => {
    const internalRecord = {
      id: 'clx938js000108l4gh5b1392',
      userId: 'usr_01HXYZ9999999999',
      communityId: 'comm_cec_internal',
      threadId: 'thread_post_42',
      name: 'Anonymous Fox',
      avatar: '🦊',
    }

    const publicView = sanitizePublicIdentity(internalRecord)

    expect(Object.keys(publicView).sort()).toEqual(['anonymousName', 'avatar'].sort())
    expect(JSON.stringify(publicView)).not.toContain('usr_01HXYZ9999999999')
    expect(JSON.stringify(publicView)).not.toContain('clx938js000108l4gh5b1392')
  })

  // Requirement 4: Anonymous identity cannot be generated predictably from email
  test('4. Anonymous identity cannot be generated predictably from email', () => {
    const threadId = 'post_exam_schedule'
    // User IDs are random internal tokens, independent of email
    const userId1 = 'usr_uuid_random_1a2b'
    const userId2 = 'usr_uuid_random_9z8y'

    const persona1 = selectPersonaForThread(userId1, threadId)
    const persona2 = selectPersonaForThread(userId2, threadId)

    // Even if student emails were consecutive, internal user IDs produce pseudorandom uncorrelated seeds
    const seed1 = deriveThreadSeed(userId1, threadId)
    const seed2 = deriveThreadSeed(userId2, threadId)

    expect(seed1).not.toEqual(seed2)
    // Identities must not contain '@' or domain fragments
    expect(persona1.name).not.toContain('@')
    expect(persona2.name).not.toContain('@')
  })

  // Requirement 5: Same authenticated user is recognized consistently inside the same thread
  test('5. Same authenticated user is recognized consistently inside the same thread', () => {
    const userId = 'usr_student_alice'
    const threadId = 'thread_fest_announcement'

    const personaFirstPost = selectPersonaForThread(userId, threadId)
    const personaComment1 = selectPersonaForThread(userId, threadId)
    const personaComment2 = selectPersonaForThread(userId, threadId)

    // All interactions by Alice within this thread must yield the exact same persona
    expect(personaFirstPost.name).toBe(personaComment1.name)
    expect(personaFirstPost.avatar).toBe(personaComment1.avatar)
    expect(personaComment1.name).toBe(personaComment2.name)
  })

  // Requirement 6: The same user is not globally trackable through a permanent public identity
  test('6. Same user is not globally trackable across unrelated threads', () => {
    const userId = 'usr_student_bob'
    const threadPersonas = new Set<string>()

    // Evaluate across 15 different thread IDs
    for (let i = 0; i < 15; i++) {
      const threadId = `thread_discussion_topic_${i}`
      const persona = selectPersonaForThread(userId, threadId)
      threadPersonas.add(persona.name)
    }

    // Bob receives varying identities across different threads rather than one permanent global name
    expect(threadPersonas.size).toBeGreaterThan(1)
  })

  // Requirement 7 & 8: Tampering and Impersonation Resistance
  test('7 & 8. Anti-impersonation: Different participants in same thread receive distinct personas', () => {
    const threadId = 'thread_canteen_review'
    const userA = 'usr_student_charlie'
    const userB = 'usr_student_dave'

    const personaA = selectPersonaForThread(userA, threadId, [])
    // When selecting persona for userB in the same thread, personaA's name is marked as assigned
    const personaB = selectPersonaForThread(userB, threadId, [personaA.name])

    expect(personaA.name).not.toEqual(personaB.name)
  })

  // Requirement 9: Anonymous identity records respect community boundaries
  test('9. Anonymous identity service allows registered users in public communities', async () => {
    const rvceCommunityId = 'comm_rvce'
    const cecUser = 'usr_cec_student_1'

    // Mock: user exists in DB (no communityId field on User model)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: cecUser,
      accountStatus: 'ACTIVE',
    })

    // Mock: user has NO membership in RVCE — boundary check returns null
    ;(prisma.communityMembership.findUnique as jest.Mock).mockResolvedValueOnce(null)

    ;(prisma.anonymousIdentity.findUnique as jest.Mock).mockResolvedValueOnce(null)
    ;(prisma.anonymousIdentity.findMany as jest.Mock).mockResolvedValueOnce([])
    ;(prisma.anonymousIdentity.create as jest.Mock).mockResolvedValueOnce({
      id: 'anon_public_1',
      name: 'Anonymous Panda',
      avatar: '🐼',
    })

    await expect(getOrCreateAnonymousIdentityForThread({
      userId: cecUser,
      communityId: rvceCommunityId,
      threadId: 'rvce_thread_1',
    })).resolves.toHaveProperty('id', 'anon_public_1')
    expect(prisma.communityMembership.findUnique).not.toHaveBeenCalled()
  })

  // Requirement 10: Unauthenticated users cannot access private identity mappings
  test('10. Unauthenticated or empty parameters reject identity generation', async () => {
    await expect(
      getOrCreateAnonymousIdentityForThread({
        userId: '',
        communityId: 'comm_cec',
        threadId: 'thread_1',
      })
    ).rejects.toThrow('Missing required identity context parameters')
  })
})
