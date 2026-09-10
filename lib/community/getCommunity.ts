import { prisma } from '../db/prisma'

const FALLBACK_COMMUNITIES = [
  {
    id: 'comm-cec-seed',
    name: 'City Engineering College',
    slug: 'cec',
    collegeName: 'City Engineering College',
    emailDomain: 'cec.edu',
    status: 'VERIFIED',
    description: 'The unofficial student tea room.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function getCommunityBySlug(slug: string) {
  if (!slug) return null
  const normalized = slug.toLowerCase()

  try {
    const community = await prisma.community.findUnique({
      where: { slug: normalized },
    })
    if (community) return community
  } catch (_err) {
    console.warn('[getCommunityBySlug] Database offline or unreachable, using fallback.')
  }

  // Graceful fallback for local preview if DB is offline
  return FALLBACK_COMMUNITIES.find((c) => c.slug === normalized) ?? null
}

export async function getCommunityByDomain(domain: string) {
  if (!domain) return null
  const normalized = domain.toLowerCase()

  try {
    // emailDomain is no longer unique, so we use findFirst
    const community = await prisma.community.findFirst({
      where: { emailDomain: normalized },
    })
    if (community) return community
  } catch (_err) {
    console.warn('[getCommunityByDomain] Database offline or unreachable, using fallback.')
  }

  return FALLBACK_COMMUNITIES.find((c) => c.emailDomain === normalized) ?? null
}

export async function getAllCommunities() {
  try {
    return await prisma.community.findMany({
      orderBy: { name: 'asc' },
    })
  } catch (_err) {
    console.warn('[getAllCommunities] Database offline or unreachable, using fallback.')
    return FALLBACK_COMMUNITIES
  }
}
