import crypto from 'crypto'

const PEPPER = process.env.SESSION_SECRET || 'universitea-permanent-crypto-pepper-2026'

/**
 * Creates a one-way cryptographic SHA-256 HMAC hash of the email.
 * This guarantees that even if the student's email contains their real name
 * (e.g. "firstname.lastname@cec.edu"), the plaintext email and name are NEVER
 * saved in the database or visible to anyone.
 */
export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  return crypto.createHmac('sha256', PEPPER).update(normalized).digest('hex')
}

const ADJECTIVES = [
  'Steeped',
  'Mystic',
  'Clever',
  'Silent',
  'Velvet',
  'Amber',
  'Emerald',
  'Crimson',
  'Copper',
  'Golden',
  'Shadow',
  'Cosmic',
  'Frost',
  'Swift',
  'Gentle',
  'Midnight',
  'Solar',
  'Lunar',
]

const NOUNS = [
  'Otter',
  'Falcon',
  'Badger',
  'Fox',
  'Owl',
  'Lynx',
  'Panda',
  'Sparrow',
  'Raven',
  'Hawk',
  'Finch',
  'Wolf',
  'Heron',
  'Stag',
  'Beaver',
  'Tiger',
]

/**
 * Generates a friendly, anonymous college alias.
 * e.g., "Steeped Otter #492" or "Amber Falcon #813"
 */
export function generateAnonymousHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(100 + Math.random() * 900)
  return `${adj} ${noun} #${num}`
}
