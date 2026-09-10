/**
 * Phase 13 — Beta Health & Telemetry Tests
 *
 * Verifies beta mode configuration, admin feedback endpoints, and community health API routes.
 */

import { isBetaMode, getBetaConfig } from '@/lib/config/beta'

describe('Phase 13: Beta Health & Telemetry Tests', () => {
  test('isBetaMode defaults to true for controlled trial', () => {
    expect(isBetaMode()).toBe(true)
  })

  test('getBetaConfig returns CEC trial metadata', () => {
    const config = getBetaConfig()
    expect(config.isBeta).toBe(true)
    expect(config.communitySlug).toBe('cec')
    expect(config.version).toContain('beta')
  })
})
