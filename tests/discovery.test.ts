import { searchPosts, processTagsForPost, getPopularTags } from '@/lib/discovery/searchService'
import { getTrendingPosts } from '@/lib/discovery/trendingService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    postTag: {
      upsert: jest.fn(),
    }
  },
}))

describe('Phase 8: Discovery - Search, Tags, Trending', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('1. Search filters by community and query', async () => {
    (prisma.post.findMany as jest.Mock).mockResolvedValueOnce([{ id: 'p1', title: 'Test' }])

    const result = await searchPosts({
      communityId: 'comm_1',
      query: 'Test'
    })

    expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        communityId: 'comm_1',
        OR: [
          { title: { contains: 'Test', mode: 'insensitive' } },
          { content: { contains: 'Test', mode: 'insensitive' } },
          { category: { contains: 'Test', mode: 'insensitive' } }
        ]
      })
    }))
    expect(result.posts.length).toBe(1)
  })

  test('2. Tags are correctly extracted and normalized', async () => {
    ;(prisma.tag.upsert as jest.Mock).mockResolvedValue({ id: 'tag_1' })
    ;(prisma.postTag.upsert as jest.Mock).mockResolvedValue({})

    await processTagsForPost('post_1', 'comm_1', 'Hello #Placements and #exams!')

    // Should insert placements and exams
    expect(prisma.tag.upsert).toHaveBeenCalledTimes(2)
    expect(prisma.tag.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ name: 'placements', displayName: 'Placements' })
    }))
    expect(prisma.tag.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ name: 'exams', displayName: 'exams' })
    }))
    
    expect(prisma.postTag.upsert).toHaveBeenCalledTimes(2)
  })

  test('3. Trending algorithm favors high engagement and recency', async () => {
    const now = Date.now()
    ;(prisma.post.findMany as jest.Mock).mockResolvedValueOnce([
      { 
        id: 'old_high_votes', 
        score: 100, 
        createdAt: new Date(now - 70 * 60 * 60 * 1000), // 70 hours old
        _count: { comments: 5, votes: 100 }
      },
      { 
        id: 'new_active', 
        score: 10, 
        createdAt: new Date(now - 1 * 60 * 60 * 1000), // 1 hour old
        _count: { comments: 20, votes: 10 }
      }
    ])

    const trending = await getTrendingPosts('comm_1')
    
    // new_active: (10 * 1.5) + (20 * 2) - (1^1.5) = 15 + 40 - 1 = 54
    // old_high: (100 * 1.5) + (5 * 2) - (70^1.5) = 150 + 10 - 585 = -425
    // Therefore 'new_active' should rank higher despite fewer total votes

    expect(trending.length).toBe(2)
    expect(trending[0].id).toBe('new_active')
    expect(trending[1].id).toBe('old_high_votes')
  })
})
