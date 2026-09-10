import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'

// Mock in-memory feedback store for admin triage during beta
const feedbackStore: Array<{
  id: string
  category: string
  message: string
  status: 'NEW' | 'TRIAGED' | 'RESOLVED'
  createdAt: string
}> = [
  {
    id: 'fb_1',
    category: 'VERIFICATION',
    message: 'Can we attach PDF syllabus copies as proof receipts?',
    status: 'NEW',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb_2',
    category: 'UX',
    message: 'Love the anonymous avatars in thread discussions!',
    status: 'TRIAGED',
    createdAt: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ feedback: feedbackStore }, { status: 200 })
  } catch (error) {
    console.error('[Admin Feedback Get Error]:', error)
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedbackId, status } = body

    const item = feedbackStore.find((f) => f.id === feedbackId)
    if (item && ['NEW', 'TRIAGED', 'RESOLVED'].includes(status)) {
      item.status = status
    }

    return NextResponse.json({ success: true, item }, { status: 200 })
  } catch (error) {
    console.error('[Admin Feedback Patch Error]:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}
