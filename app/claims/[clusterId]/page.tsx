import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function ClaimHubPage({ params }: { params: Promise<{ clusterId: string }> }) {
  const { clusterId } = await params
  const cluster = await prisma.claimCluster.findUnique({
    where: { id: clusterId },
    include: {
      community: { select: { slug: true, name: true } },
      claims: {
        orderBy: { createdAt: 'asc' },
        include: { post: { select: { id: true, title: true, verificationStatus: true, createdAt: true, _count: { select: { receipts: true } } } } },
      },
    },
  })

  if (!cluster) notFound()

  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <Link href={`/r/${cluster.community.slug}`} className="text-sm text-emerald-400 hover:text-emerald-300">Back to r/{cluster.community.slug}</Link>
      <div className="mt-6 border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-widest text-amber-400">Claim Hub</p>
        <h1 className="text-3xl font-bold text-white mt-2">{cluster.label}</h1>
        <p className="text-sm text-zinc-400 mt-2">A public, chronological view of related Tea and verification activity. Contributors remain anonymous.</p>
        <span className="inline-block mt-4 text-xs text-zinc-400 border border-zinc-700 rounded-full px-3 py-1">{cluster.status}</span>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Claim timeline</h2>
        <div className="space-y-4 border-l border-zinc-800 pl-5">
          {cluster.claims.map((claim) => (
            <article key={claim.id} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <span className="absolute -left-[26px] top-5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                <time>{claim.createdAt.toLocaleString()}</time>
                <span>{claim.post.verificationStatus}</span>
              </div>
              <p className="text-zinc-200 mt-2">{claim.normalizedStatement}</p>
              <Link href={`/r/${cluster.community.slug}/post/${claim.post.id}`} className="text-sm text-emerald-400 hover:text-emerald-300 inline-block mt-3">View related Tea: {claim.post.title}</Link>
              <p className="text-xs text-zinc-500 mt-2">{claim.post._count.receipts} receipt(s) attached</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
