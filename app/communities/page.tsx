import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

export default async function CommunitiesDirectoryPage() {
  const communities = await prisma.community.findMany({
    where: { status: 'VERIFIED' },
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">College Community Directory</h1>
            <p className="text-sm text-slate-400">Discover verified campus tea rooms across UniversiTea.</p>
          </div>
          <Link
            href="/create-community"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Create Community
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((comm) => (
            <Link
              key={comm.id}
              href={`/r/${comm.slug}`}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">r/{comm.slug}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                  Verified Room
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100">{comm.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2">{comm.description || 'Student tea room.'}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
