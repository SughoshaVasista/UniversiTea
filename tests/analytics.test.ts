/**
 * Phase 12 — Analytics & Feedback Test Suite
 *
 * Verifies privacy-preserving event payload sanitization and feedback validation.
 */

import { sanitizeEventPayload } from '@/lib/analytics/tracker'

describe('Phase 12: Analytics & Feedback Tests', () => {
  test('Event payload sanitizer strips PII fields (email, password, user, token)', () => {
    const rawPayload = {
      event: 'POST_CREATED' as const,
      communitySlug: 'cec',
      metadata: {
        postId: 'post_123',
        userEmail: 'student@cec.edu',
        passwordToken: 'secret_token',
        contentLength: 150,
      },
    }

    const clean = sanitizeEventPayload(rawPayload)

    expect(clean.event).toBe('POST_CREATED')
    expect(clean.communitySlug).toBe('cec')
    expect(clean.metadata.postId).toBe('post_123')
    expect(clean.metadata.contentLength).toBe(150)
    // Must strip PII
    expect(clean.metadata).not.toHaveProperty('userEmail')
    expect(clean.metadata).not.toHaveProperty('passwordToken')
  })
})
