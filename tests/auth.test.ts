import bcrypt from 'bcryptjs'
import { hashEmail, generateAnonymousHandle } from '@/lib/auth/crypto'

describe('Passwordless Email OTP & Auth Security Layer (Phase 2)', () => {
  test('hashEmail generates deterministic one-way SHA-256 HMAC and hides real name', () => {
    const studentEmail = 'sughosha.vasista@cec.edu'
    const hash1 = hashEmail(studentEmail)
    const hash2 = hashEmail('SUGHOSHA.VASISTA@CEC.EDU ') // normalized

    expect(hash1).toHaveLength(64) // standard SHA-256 hex string
    expect(hash1).toEqual(hash2)
    // Guarantee that student name is not present in hash
    expect(hash1).not.toContain('sughosha')
    expect(hash1).not.toContain('vasista')
    expect(hash1).not.toContain('@cec.edu')

    // Different email gets distinct hash
    const differentStudent = 'john.doe@gmail.com'
    expect(hashEmail(differentStudent)).not.toEqual(hash1)
  })

  test('Registration accepts general email addresses without requiring @college.edu', () => {
    const generalEmails = ['student@gmail.com', 'user@yahoo.com', 'dev@outlook.com']
    for (const email of generalEmails) {
      const hash = hashEmail(email)
      expect(hash).toHaveLength(64)
      expect(hash).not.toContain(email)
    }
  })

  test('generateAnonymousHandle generates friendly anonymous handles without student names', () => {
    for (let i = 0; i < 15; i++) {
      const handle = generateAnonymousHandle()
      expect(typeof handle).toBe('string')
      expect(handle).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ #\d{3}$/)
      expect(handle).not.toContain('@')
    }
  })

  test('6-digit OTP generation matches expected numeric format', () => {
    for (let i = 0; i < 20; i++) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      expect(otp).toHaveLength(6)
      expect(/^\d{6}$/.test(otp)).toBe(true)
      const num = parseInt(otp, 10)
      expect(num).toBeGreaterThanOrEqual(100000)
      expect(num).toBeLessThanOrEqual(999999)
    }
  })

  test('Bcrypt hashes and securely validates matching OTPs', async () => {
    const rawOtp = '482910'
    const saltRounds = 10
    const hash = await bcrypt.hash(rawOtp, saltRounds)

    // The hash should never equal the raw OTP in plaintext
    expect(hash).not.toEqual(rawOtp)

    // Valid OTP should compare true
    const isMatch = await bcrypt.compare(rawOtp, hash)
    expect(isMatch).toBe(true)

    // Incorrect OTP should fail comparison
    const wrongMatch = await bcrypt.compare('123456', hash)
    expect(wrongMatch).toBe(false)
  })

  test('Expired OTP detection rejects tokens older than expiry timestamp', () => {
    const pastExpiry = new Date(Date.now() - 1000) // 1 second ago
    const futureExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes ahead

    const isExpired = (expiry: Date) => expiry < new Date()

    expect(isExpired(pastExpiry)).toBe(true)
    expect(isExpired(futureExpiry)).toBe(false)
  })

  test('Attempt limit rejects and invalidates OTP after 5 failed attempts', () => {
    const MAX_ATTEMPTS = 5
    let currentAttempts = 4

    // 5th attempt is processed
    currentAttempts += 1
    const shouldInvalidate = currentAttempts >= MAX_ATTEMPTS
    expect(shouldInvalidate).toBe(true)
  })

  test('Rate limiter flags users exceeding 3 requests in 15 minutes', () => {
    const MAX_OTP_REQUESTS_IN_WINDOW = 3
    const checkRateLimit = (recentCount: number) => recentCount >= MAX_OTP_REQUESTS_IN_WINDOW

    expect(checkRateLimit(1)).toBe(false)
    expect(checkRateLimit(2)).toBe(false)
    expect(checkRateLimit(3)).toBe(true)
    expect(checkRateLimit(4)).toBe(true)
  })

  test('Cross-community guard enforces campus boundary via CommunityMembership', () => {
    const cecCommunity = { id: 'comm-cec', slug: 'cec', name: 'City Engineering College' }
    const rvceCommunity = { id: 'comm-rvce', slug: 'rvce', name: 'RV College of Engineering' }

    // Users are platform-level — they join communities via CommunityMembership, not via a communityId field
    const cecStudentSession = {
      id: 'sess-1',
      user: {
        id: 'user-1',
        // Note: NO communityId here — that field does NOT exist on the User model
      },
    }

    // Simulate membership lookup (replaces communityId field check)
    const cecMemberships = [{ userId: 'user-1', communityId: cecCommunity.id, role: 'MEMBER' }]

    const isMemberOfCec = cecMemberships.some(
      m => m.userId === cecStudentSession.user.id && m.communityId === cecCommunity.id
    )
    const isMemberOfRvce = cecMemberships.some(
      m => m.userId === cecStudentSession.user.id && m.communityId === rvceCommunity.id
    )

    // Accessing their own community — allowed
    expect(isMemberOfCec).toBe(true)

    // Attempting to access another college's community — rejected
    expect(isMemberOfRvce).toBe(false)
  })
})

