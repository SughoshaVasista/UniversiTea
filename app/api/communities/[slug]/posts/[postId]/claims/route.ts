import { NextRequest, NextResponse } from 'next/server'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getClaimsForPost } from '@/lib/ai/claims/claimExtractionService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const claims = await getClaimsForPost(postId)
    return NextResponse.json({ claims })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
