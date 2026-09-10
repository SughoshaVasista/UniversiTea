import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

async function handleLogout(request: Request) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('universitea_session')?.value

  if (sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } })
    } catch {
      // Session might already be gone
    }
  }

  // Clear cookie and redirect to homepage
  const url = new URL('/', request.url)
  const response = NextResponse.redirect(url)

  response.cookies.set('universitea_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })

  return response
}

export async function POST(request: Request) {
  return handleLogout(request)
}

export async function GET(request: Request) {
  return handleLogout(request)
}
