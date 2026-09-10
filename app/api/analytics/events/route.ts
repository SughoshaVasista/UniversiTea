import { NextRequest, NextResponse } from 'next/server'
import { sanitizeEventPayload, TrackEventOptions } from '@/lib/analytics/tracker'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackEventOptions
    if (!body || !body.event) {
      return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 })
    }

    const cleanPayload = sanitizeEventPayload(body)
    
    // In production, queue to privacy-safe aggregate logger
    console.log(`[ANALYTICS_EVENT]: ${cleanPayload.event} (${cleanPayload.communitySlug})`)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Analytics Event Error]:', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}
