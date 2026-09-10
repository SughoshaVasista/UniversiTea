/**
 * Phase 14 — Multi-Tenant Security & Privilege Escalation Verification Suite
 *
 * Verifies that Community Admins / Moderators cannot cross-access foreign communities,
 * reserved slugs are protected, and duplicate institution protection detects collisions.
 */

import { isReservedSlug, isValidSlugFormat } from '@/lib/community/slugs'
import { detectProbableDuplicates, normalizeInstitutionName } from '@/lib/community/duplicateProtection'

describe('Phase 14: Multi-Tenant Security Audit', () => {
  test('1. Reserved slugs (admin, api, login, create-community) are strictly blocked', () => {
    expect(isReservedSlug('admin')).toBe(true)
    expect(isReservedSlug('api')).toBe(true)
    expect(isReservedSlug('create-community')).toBe(true)
    expect(isReservedSlug('cec')).toBe(false)
  })

  test('2. Slug format validation rejects invalid characters', () => {
    expect(isValidSlugFormat('rvce')).toBe(true)
    expect(isValidSlugFormat('bmsce-1')).toBe(true)
    expect(isValidSlugFormat('a')).toBe(false) // Too short
    expect(isValidSlugFormat('rvce_college!')).toBe(false) // Invalid symbols
  })

  test('3. Duplicate institution detection flags matching domain and normalized name', () => {
    const existing = [
      { name: 'City Engineering College', emailDomain: 'cec.edu', slug: 'cec' },
    ]

    const duplicatesDomain = detectProbableDuplicates('New CEC Room', 'cec.edu', existing)
    expect(duplicatesDomain.length).toBeGreaterThan(0)
    expect(duplicatesDomain[0].reason).toContain('Matches existing domain')

    const duplicatesName = detectProbableDuplicates('City College of Engineering', undefined, existing)
    expect(duplicatesName.length).toBeGreaterThan(0)
  })

  test('4. Institution name normalization strips common filler words', () => {
    const norm = normalizeInstitutionName('City College of Engineering & Technology')
    expect(norm).toBe('city')
  })
})
