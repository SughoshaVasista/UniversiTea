/**
 * Phase 14 — Duplicate Institution Protection
 *
 * Normalizes college names, domains, and locations to flag potential duplicate community applications.
 */

export function normalizeInstitutionName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/\b(college|of|engineering|technology|institute|university|campus)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function detectProbableDuplicates(
  requestedName: string,
  requestedDomain: string | undefined,
  existingCommunities: Array<{ name: string; emailDomain: string | null; slug: string }>
): Array<{ slug: string; name: string; reason: string }> {
  const duplicates: Array<{ slug: string; name: string; reason: string }> = []
  const normRequested = normalizeInstitutionName(requestedName)

  for (const comm of existingCommunities) {
    // 1. Check domain match
    if (requestedDomain && comm.emailDomain && requestedDomain.toLowerCase() === comm.emailDomain.toLowerCase()) {
      duplicates.push({
        slug: comm.slug,
        name: comm.name,
        reason: `Matches existing domain @${comm.emailDomain}`,
      })
      continue
    }

    // 2. Check normalized name similarity
    const normExisting = normalizeInstitutionName(comm.name)
    if (normRequested.length > 2 && normExisting.length > 2 && normRequested === normExisting) {
      duplicates.push({
        slug: comm.slug,
        name: comm.name,
        reason: `High similarity with existing institution name "${comm.name}"`,
      })
    }
  }

  return duplicates
}
