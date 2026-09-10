/**
 * Phase 14 — Reserved Slugs & Slug Validation Utilities
 *
 * Prevents community creation collisions with platform routes.
 */

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'signup',
  'auth',
  'settings',
  'communities',
  'search',
  'about',
  'rules',
  'help',
  'privacy',
  'terms',
  'create-community',
  'dashboard',
  'feedback',
  'health',
])

export function isReservedSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return true
  const normalized = slug.trim().toLowerCase()
  return RESERVED_SLUGS.has(normalized)
}

export function isValidSlugFormat(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false
  // Slugs must be 3-30 chars, lowercase alphanumeric or hyphen
  return /^[a-z0-9-]{3,30}$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-')
}
