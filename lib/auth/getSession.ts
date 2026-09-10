import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'

export async function getSession(request?: Request) {
  let sessionId: string | undefined

  if (request) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(/universitea_session=([^;]+)/)
      if (match) {
        sessionId = match[1]
      }
    }
  }

  if (!sessionId) {
    try {
      const cookieStore = await cookies()
      sessionId = cookieStore.get('universitea_session')?.value
    } catch {
      // Fallback when called outside of Next.js server cookie store
    }
  }

  if (!sessionId) {
    return null
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: true, // Community is no longer hardcoded to the user
      },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session
  } catch (err) {
    console.error('[getSession] Error querying session:', err)
    return null
  }
}
