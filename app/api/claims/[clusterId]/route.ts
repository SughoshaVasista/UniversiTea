import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(_request: Request, { params }: { params: Promise<{ clusterId: string }> }) {
  const { clusterId } = await params
  const cluster = await prisma.claimCluster.findUnique({
    where: { id: clusterId },
    include: {
      community: { select: { slug: true, name: true } },
      claims: {
        orderBy: { createdAt: 'asc' },
        include: {
          post: {
            select: {
              id: true, title: true, content: true, verificationStatus: true, createdAt: true,
              _count: { select: { receipts: true } },
            },
          },
        },
      },
    },
  })

  if (!cluster) return NextResponse.json({ error: 'Claim hub not found' }, { status: 404 })

  return NextResponse.json({
    id: cluster.id,
    label: cluster.label,
    status: cluster.status,
    community: cluster.community,
    claims: cluster.claims.map((claim) => ({
      id: claim.id,
      statement: claim.normalizedStatement,
      createdAt: claim.createdAt.toISOString(),
      post: { ...claim.post, createdAt: claim.post.createdAt.toISOString() },
    })),
  })
}
