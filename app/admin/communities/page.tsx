import React from 'react'
import { getSession } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'

export default async function AdminCommunitiesPage() {
  const session = await getSession()
  if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const [communities, applications] = await Promise.all([
    prisma.community.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.communityApplication.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Platform Multi-Community Management</h1>
          <p className="text-sm text-slate-400">Review campus applications, monitor live rooms, and manage platform isolation.</p>
        </div>

        {/* Applications */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Pending Community Applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">r/{app.requestedSlug}</span>
                    <h3 className="text-base font-medium text-slate-100">{app.collegeName}</h3>
                    <p className="text-xs text-slate-400">Domain: {app.emailDomain || 'None'} | Status: {app.status}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded-md">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Communities */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Live Campus Communities ({communities.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.map((comm) => (
              <div key={comm.id} className="p-4 bg-slate-800/40 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">r/{comm.slug}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    comm.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {comm.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{comm.name}</h3>
                <p className="text-xs text-slate-400">{comm.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
