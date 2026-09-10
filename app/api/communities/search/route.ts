import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ communities: [] }, { status: 200 })
    }

    const normalized = query.trim().toLowerCase()

    const communities = await prisma.community.findMany({
      where: {
        status: 'VERIFIED',
        OR: [
          { name: { contains: normalized, mode: 'insensitive' } },
          { slug: { contains: normalized, mode: 'insensitive' } },
          { collegeName: { contains: normalized, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        collegeName: true,
        description: true,
      },
      take: 10,
    })

    return NextResponse.json({ communities }, { status: 200 })
  } catch (error) {
    console.error('[Community Search Error]:', error)
    return NextResponse.json({ error: 'Failed to search communities' }, { status: 500 })
  }
}
