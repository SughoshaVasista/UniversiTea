import { NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await getParticipationSession()
  if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { anonymousHandle: true, profileAvatar: true, profileBio: true, theme: true, preferredNameStyle: true } })
  return NextResponse.json({ user })
}

export async function PATCH(request: Request) {
  const session = await getParticipationSession()
  if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })
  const body = await request.json()
  const anonymousHandle = typeof body.anonymousHandle === 'string' ? body.anonymousHandle.trim().slice(0, 40) : undefined
  const profileBio = typeof body.profileBio === 'string' ? body.profileBio.trim().slice(0, 160) : undefined
  const profileAvatar = typeof body.profileAvatar === 'string' ? body.profileAvatar.slice(0, 8) : undefined
  const theme = ['light', 'dark', 'system'].includes(body.theme) ? body.theme : undefined
  if (anonymousHandle && /admin|moderator|universiteasupport/i.test(anonymousHandle)) return NextResponse.json({ error: 'That display name is reserved.' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: session.user.id }, data: { anonymousHandle, profileBio, profileAvatar, theme } })
  return NextResponse.json({ success: true, user: { anonymousHandle: user.anonymousHandle, profileAvatar: user.profileAvatar, profileBio: user.profileBio, theme: user.theme } })
}
