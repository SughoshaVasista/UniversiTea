import { NextRequest, NextResponse } from 'next/server'
import { getParticipationSession } from '@/lib/auth/participation'
import { prisma } from '@/lib/db/prisma'

type Action = 'FOLLOW_COMMUNITY' | 'FOLLOW_TOPIC' | 'SAVE_POST' | 'MUTE'

export async function POST(request: NextRequest) {
  const session = await getParticipationSession()
  if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })

  try {
    const body = await request.json()
    const action = body.action as Action

    if (action === 'FOLLOW_COMMUNITY') {
      const community = await prisma.community.findUnique({ where: { slug: String(body.slug || '').toLowerCase() } })
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 })
      await prisma.communityFollow.upsert({
        where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
        update: {},
        create: { userId: session.user.id, communityId: community.id },
      })
      return NextResponse.json({ success: true, action })
    }

    if (action === 'FOLLOW_TOPIC') {
      const community = await prisma.community.findUnique({ where: { slug: String(body.slug || '').toLowerCase() } })
      const name = String(body.topic || '').trim().toLowerCase()
      if (!community || !name) return NextResponse.json({ error: 'Community and topic are required' }, { status: 400 })
      const tag = await prisma.tag.upsert({
        where: { communityId_name: { communityId: community.id, name } },
        update: {},
        create: { communityId: community.id, name, displayName: name.replace(/\b\w/g, (letter) => letter.toUpperCase()) },
      })
      await prisma.topicFollow.upsert({
        where: { userId_tagId: { userId: session.user.id, tagId: tag.id } },
        update: {},
        create: { userId: session.user.id, tagId: tag.id },
      })
      return NextResponse.json({ success: true, action, topic: tag.displayName })
    }

    if (action === 'SAVE_POST') {
      const post = await prisma.post.findFirst({ where: { id: String(body.postId || ''), status: 'PUBLISHED', deletedAt: null }, select: { id: true } })
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      await prisma.savedPost.upsert({
        where: { userId_postId: { userId: session.user.id, postId: post.id } },
        update: {},
        create: { userId: session.user.id, postId: post.id },
      })
      return NextResponse.json({ success: true, action })
    }

    if (action === 'MUTE') {
      const targetType = String(body.targetType || '').toUpperCase()
      const targetId = String(body.targetId || '')
      if (!['POST', 'TOPIC', 'COMMUNITY'].includes(targetType) || !targetId) {
        return NextResponse.json({ error: 'Valid mute target required' }, { status: 400 })
      }
      await prisma.mute.upsert({
        where: { userId_targetType_targetId: { userId: session.user.id, targetType, targetId } },
        update: {},
        create: { userId: session.user.id, targetType, targetId },
      })
      return NextResponse.json({ success: true, action })
    }

    return NextResponse.json({ error: 'Unknown preference action' }, { status: 400 })
  } catch (error) {
    console.error('[preferences]', error)
    return NextResponse.json({ error: 'Could not update preference' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getParticipationSession()
  if (!session) return NextResponse.json({ error: 'Registered account required' }, { status: 401 })

  const body = await request.json()
  const targetType = String(body.targetType || '').toUpperCase()
  const targetId = String(body.targetId || '')

  if (targetType === 'COMMUNITY') {
    const community = await prisma.community.findUnique({ where: { slug: targetId }, select: { id: true } })
    if (community) await prisma.communityFollow.deleteMany({ where: { userId: session.user.id, communityId: community.id } })
  } else if (targetType === 'TOPIC') {
    await prisma.topicFollow.deleteMany({ where: { userId: session.user.id, tagId: targetId } })
  } else if (targetType === 'POST') {
    await prisma.savedPost.deleteMany({ where: { userId: session.user.id, postId: targetId } })
  } else if (targetType === 'MUTE') {
    await prisma.mute.deleteMany({ where: { userId: session.user.id, targetType: String(body.mutedType || '').toUpperCase(), targetId } })
  } else {
    return NextResponse.json({ error: 'Unknown preference target' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
