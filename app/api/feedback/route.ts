import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'

export async function POST(request: NextRequest) {
  try {
    const session = await getParticipationSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, message } = body

    if (!category || !message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Feedback message must be at least 5 characters.' }, { status: 400 })
    }

    // Process and log feedback privately
    console.log(`[USER_FEEDBACK] Category: ${category} | Message: ${message.trim().substring(0, 100)}`)

    return NextResponse.json({ success: true, message: 'Thank you for your feedback!' }, { status: 200 })
  } catch (error) {
    console.error('[Feedback Error]:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
