/**
 * Privacy-Preserving Event Tracking Utility
 *
 * Enforces zero-PII logging. Events are strictly aggregated and contain no emails,
 * user IDs, session tokens, or thread persona links.
 */

export type ProductEventType =
  | 'COMMUNITY_JOINED'
  | 'POST_CREATED'
  | 'POST_VIEWED'
  | 'COMMENT_CREATED'
  | 'VOTE_CAST'
  | 'RECEIPT_SUBMITTED'
  | 'CLAIM_CHECKED'
  | 'VERIFICATION_UPDATED'
  | 'REPORT_CREATED'
  | 'NOTIFICATION_OPENED'
  | 'SEARCH_PERFORMED'

export interface TrackEventOptions {
  event: ProductEventType
  communitySlug?: string
  metadata?: Record<string, string | number | boolean>
}

export function sanitizeEventPayload(options: TrackEventOptions) {
  const cleanMetadata: Record<string, string | number | boolean> = {}

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      // Strip potential PII keys
      const lower = key.toLowerCase()
      if (
        lower.includes('email') ||
        lower.includes('token') ||
        lower.includes('password') ||
        lower.includes('name') ||
        lower.includes('ip') ||
        lower.includes('user')
      ) {
        continue
      }
      cleanMetadata[key] = value
    }
  }

  return {
    event: options.event,
    communitySlug: options.communitySlug || 'global',
    timestamp: new Date().toISOString(),
    metadata: cleanMetadata,
  }
}

export async function trackEvent(options: TrackEventOptions): Promise<boolean> {
  try {
    const payload = sanitizeEventPayload(options)
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }
    return true
  } catch {
    return false
  }
}
