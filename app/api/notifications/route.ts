import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/getSession'
import { getUserNotifications } from '@/lib/notifications/notificationService'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notifications = await getUserNotifications(session.user.id)
    
    return NextResponse.json({ notifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
