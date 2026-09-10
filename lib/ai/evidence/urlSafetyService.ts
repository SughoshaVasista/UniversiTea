/**
 * Phase 10 — URL Safety Service
 *
 * Validates URLs before any server-side fetch to prevent SSRF attacks.
 * Blocks localhost, private networks, cloud metadata endpoints.
 */

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254', // AWS/GCP metadata
]

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\./,
  /^fc00:/i,
  /^fe80:/i,
]

export interface URLSafetyResult {
  safe: boolean
  reason?: string
}

export function validateURL(rawUrl: string): URLSafetyResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, reason: 'Empty or invalid URL.' }
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { safe: false, reason: 'Malformed URL.' }
  }

  // Only allow http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block known dangerous hosts
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { safe: false, reason: `Blocked host: ${hostname}` }
  }

  // Block private IP ranges
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      return { safe: false, reason: `Private network address blocked: ${hostname}` }
    }
  }

  // Block cloud metadata paths
  if (parsed.pathname.includes('/latest/meta-data') ||
      parsed.pathname.includes('/metadata/') ||
      parsed.pathname.includes('/computeMetadata/')) {
    return { safe: false, reason: 'Cloud metadata endpoint blocked.' }
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'URLs with embedded credentials are not allowed.' }
  }

  return { safe: true }
}
