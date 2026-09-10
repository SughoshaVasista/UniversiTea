import { createPost, votePost } from '@/lib/post/postService'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    post: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}))

jest.mock('@/lib/identity/anonymousService', () => ({
  getOrCreateAnonymousIdentityForThread: jest.fn().mockResolvedValue({ id: 'anon_1', name: 'Anonymous Panda', avatar: '🐼' }),
}))

describe('Phase 4: Posts & Voting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('1. Post creation fails with short title', async () => {
    await expect(
      createPost({
        communityId: 'comm_1',
        userId: 'usr_1',
        title: 'a',
        content: 'This is a long enough content body.',
        category: 'HOT_TEA'
      })
    ).rejects.toThrow('Title must be at least 3 characters')
  })

  test('2. Voting on a non-existent post fails', async () => {
    (prisma.post.findFirst as jest.Mock).mockResolvedValueOnce(null)

    await expect(
      votePost('invalid_post', 'usr_1', 'comm_1', 1)
    ).rejects.toThrow('Post not found or unauthorized')
  })

  test('3. New vote is created successfully', async () => {
    (prisma.post.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'post_1', communityId: 'comm_1' });
    (prisma.vote.findUnique as jest.Mock).mockResolvedValueOnce(null)

    await votePost('post_1', 'usr_1', 'comm_1', 1)

    expect(prisma.vote.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { postId: 'post_1', userId: 'usr_1', value: 1 }
    }))
    expect(prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'post_1' },
      data: { upvotes: { increment: 1 }, score: { increment: 1 } }
    }))
  })

  test('4. Changing vote updates correctly', async () => {
    (prisma.post.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'post_1', communityId: 'comm_1' });
    (prisma.vote.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'vote_1', value: 1 }) // previously upvoted

    await votePost('post_1', 'usr_1', 'comm_1', -1) // change to downvote

    expect(prisma.vote.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'vote_1' },
      data: { value: -1 }
    }))
    expect(prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'post_1' },
      data: { upvotes: { decrement: 1 }, downvotes: { increment: 1 }, score: { decrement: 2 } }
    }))
  })
})
