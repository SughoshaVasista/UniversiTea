import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { VerificationBadge, VerificationStatus } from '@/components/ui/VerificationBadge'
import { getCommunityBySlug, getCommunityByDomain } from '@/lib/community/getCommunity'
import { prisma } from '@/lib/db/prisma'

// Mock prisma client for unit tests
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    community: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

describe('Community Data Access & UI Layer (Phase 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getCommunityBySlug returns community data when slug exists', async () => {
    const mockCommunity = {
      id: 'comm-1',
      name: 'City Engineering College',
      slug: 'cec',
      collegeName: 'City Engineering College',
      emailDomain: 'cec.edu',
      status: 'VERIFIED',
      description: 'The unofficial student tea room.',
    }

    ;(prisma.community.findUnique as jest.Mock).mockResolvedValueOnce(mockCommunity)

    const result = await getCommunityBySlug('cec')
    expect(result).toEqual(mockCommunity)
    expect(prisma.community.findUnique).toHaveBeenCalledWith({
      where: { slug: 'cec' },
    })
  })

  test('getCommunityBySlug normalizes slug to lowercase', async () => {
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValueOnce(null)

    await getCommunityBySlug('CEC')
    expect(prisma.community.findUnique).toHaveBeenCalledWith({
      where: { slug: 'cec' },
    })
  })

  test('getCommunityBySlug returns null for nonexistent community', async () => {
    ;(prisma.community.findUnique as jest.Mock).mockResolvedValueOnce(null)

    const result = await getCommunityBySlug('fakecollege')
    expect(result).toBeNull()
  })

  test('getCommunityByDomain finds community by college email domain', async () => {
    const mockCommunity = {
      id: 'comm-1',
      name: 'City Engineering College',
      slug: 'cec',
      emailDomain: 'cec.edu',
    }

    ;(prisma.community.findFirst as jest.Mock).mockResolvedValueOnce(mockCommunity)

    const result = await getCommunityByDomain('cec.edu')
    expect(result).toEqual(mockCommunity)
    expect(prisma.community.findFirst).toHaveBeenCalledWith({
      where: { emailDomain: 'cec.edu' },
    })
  })

  test('VerificationBadge renders correct labels for statuses', () => {
    const statuses: Array<{ status: VerificationStatus; expectedText: string }> = [
      { status: 'UNVERIFIED', expectedText: 'Unverified' },
      { status: 'CHECKING', expectedText: 'Checking' },
      { status: 'LIKELY', expectedText: 'Likely True' },
      { status: 'VERIFIED', expectedText: 'Verified Tea' },
      { status: 'DISPUTED', expectedText: 'Disputed' },
      { status: 'FALSE', expectedText: 'False / Debunked' },
      { status: 'REMOVED', expectedText: 'Removed' },
    ]

    for (const { status, expectedText } of statuses) {
      const { unmount } = render(<VerificationBadge status={status} />)
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      unmount()
    }
  })
})
