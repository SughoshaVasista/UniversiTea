/**
 * Phase 13 — Beta Mode Configuration
 *
 * Controls whether the application is running in CEC Beta mode.
 */

export function isBetaMode(): boolean {
  return process.env.BETA_MODE !== 'false'
}

export function getBetaConfig() {
  return {
    isBeta: isBetaMode(),
    communitySlug: 'cec',
    communityName: 'City Engineering College',
    version: '0.1.0-beta',
  }
}
