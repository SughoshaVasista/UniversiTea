import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getReceiptsForPost, submitReceipt } from '@/lib/verification/receiptService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, postId: string }> }
) {
  try {
    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const receipts = await getReceiptsForPost(postId)
    
    return NextResponse.json({ receipts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string, postId: string }> }
) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, postId } = await params
    const community = await getCommunityBySlug(slug)
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, description, sourceUrl, storageKey, supportsClaim } = body

    const receipt = await submitReceipt({
      postId,
      userId: session.user.id,
      communityId: community.id,
      type,
      description,
      sourceUrl,
      storageKey,
      supportsClaim
    })

    return NextResponse.json({ success: true, receiptId: receipt.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
