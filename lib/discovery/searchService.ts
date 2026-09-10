import { prisma } from '@/lib/db/prisma'

export interface SearchOptions {
  query?: string
  communityId: string
  tags?: string[]
  verificationStatus?: string
  limit?: number
  cursor?: string
}

export async function searchPosts(opts: SearchOptions) {
  const limit = opts.limit || 20
  
  // Base where clause strictly scoped to community
  const where: any = {
    communityId: opts.communityId,
    status: 'PUBLISHED',
    deletedAt: null
  }

  // Filter by verification status if provided
  if (opts.verificationStatus && opts.verificationStatus !== 'ALL') {
    where.verificationStatus = opts.verificationStatus
  }

  // Filter by tags if provided
  if (opts.tags && opts.tags.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: { in: opts.tags.map(t => t.toLowerCase()) }
        }
      }
    }
  }

  // Perform a full-text search fallback.
  // Ideally Prisma has `search` preview feature enabled, but if not, we use basic OR contains.
  // To avoid SQL injection, Prisma automatically parameterizes these inputs.
  if (opts.query && opts.query.trim().length > 0) {
    const q = opts.query.trim()
    
    // We search title and content for simplicity in this MVP
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } }
    ]
  }

  const queryParams: any = {
    where,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      anonymousIdentity: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true, votes: true } }
    }
  }

  if (opts.cursor) {
    queryParams.cursor = { id: opts.cursor }
    queryParams.skip = 1
  }

  const posts = await prisma.post.findMany(queryParams)

  let nextCursor: string | undefined = undefined
  if (posts.length > limit) {
    const nextItem = posts.pop()
    nextCursor = nextItem?.id
  }

  return { posts, nextCursor }
}

export async function processTagsForPost(postId: string, communityId: string, text: string) {
  // Extract #tags from text
  const rawTags = text.match(/#[\w-]+/g) || []
  const uniqueTags = [...new Set(rawTags)]

  for (const rawTag of uniqueTags) {
    const displayName = rawTag.substring(1) // remove #
    const normalizedName = displayName.toLowerCase()

    // Skip excessively long tags
    if (normalizedName.length > 30) continue

    // Upsert the tag in the community
    const tag = await prisma.tag.upsert({
      where: {
        communityId_name: {
          communityId,
          name: normalizedName
        }
      },
      update: {},
      create: {
        communityId,
        name: normalizedName,
        displayName
      }
    })

    // Link tag to post
    await prisma.postTag.upsert({
      where: {
        postId_tagId: {
          postId,
          tagId: tag.id
        }
      },
      update: {},
      create: {
        postId,
        tagId: tag.id
      }
    })
  }
}

export async function getPopularTags(communityId: string, limit = 10) {
  return prisma.tag.findMany({
    where: { communityId },
    include: {
      _count: {
        select: { posts: true }
      }
    },
    orderBy: {
      posts: { _count: 'desc' }
    },
    take: limit
  })
}
