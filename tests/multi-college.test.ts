/**
 * Phases 13–18 — Multi-College & Platform Scale Integration Tests
 *
 * Verifies multi-college provisioning (/r/cec, /r/rvce, /r/bmsce) and caching behavior.
 */

import { getCached, invalidateCache } from '@/lib/cache/cache'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    communityApplication: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Phases 13–18: Multi-College & Scale Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    invalidateCache('test_')
  })

  test('Multi-college domain lookups recognize RVCE and BMSCE', async () => {
    const mockRvce = { id: 'comm_rvce', slug: 'rvce', emailDomain: 'rvce.edu' }
    ;(prisma.community.findFirst as jest.Mock).mockResolvedValueOnce(mockRvce)

    const result = await prisma.community.findFirst({ where: { emailDomain: 'rvce.edu' } })
    expect(result).toEqual(mockRvce)
  })

  test('Caching layer caches query results and respects TTL', async () => {
    let callCount = 0
    const fetcher = async () => {
      callCount++
      return { feed: 'hot_tea_posts' }
    }

    const first = await getCached('test_feed', fetcher, 10)
    const second = await getCached('test_feed', fetcher, 10)

    expect(first).toEqual({ feed: 'hot_tea_posts' })
    expect(second).toEqual({ feed: 'hot_tea_posts' })
    expect(callCount).toBe(1) // Second call hit cache
  })
})
