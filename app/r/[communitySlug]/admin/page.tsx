'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  params: Promise<{ communitySlug: string }>
}

export default function AdminDashboard({ params }: Props) {
  const [slug, setSlug] = useState<string>('')
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trustView, setTrustView] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => {
      setSlug(p.communitySlug)
      fetchReports(p.communitySlug)
    })
  }, [params])

  const fetchReports = async (communitySlug: string) => {
    try {
      const res = await fetch(`/api/admin/communities/${communitySlug}/reports`)
      if (res.status === 401 || res.status === 403) {
        router.push(`/r/${communitySlug}`)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReports(data.reports)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string, resolution: string) => {
    try {
      const res = await fetch(`/api/admin/communities/${slug}/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      })
      if (!res.ok) throw new Error('Failed to resolve')
      setReports(reports.filter(r => r.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleAction = async (report: any, action: string) => {
    try {
      // For simple MVP we hide post and resolve report
      const res = await fetch(`/api/admin/communities/${slug}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetType: report.targetType,
          targetId: report.targetId,
          reason: `Resolved report ${report.id}`
        })
      })
      if (!res.ok) throw new Error('Action failed')
      
      // Auto resolve
      await handleResolve(report.id, 'RESOLVED')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleViewTrust = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/communities/${slug}/users/${userId}/trust`)
      if (!res.ok) throw new Error('Failed to load trust profile')
      const data = await res.json()
      setTrustView(data)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">🛡️ Mod Dashboard</h1>
          <p className="text-zinc-400">/r/{slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Open Reports</h2>
            
            {reports.length === 0 ? (
              <p className="text-zinc-500 py-8 text-center">No open reports. All caught up! 🎉</p>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className="border border-zinc-800 bg-zinc-950 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-red-950/50 text-red-400 border border-red-900/50 mr-2`}>
                          {report.reason}
                        </span>
                        <span className="text-xs text-zinc-500">Target: {report.targetType}</span>
                      </div>
                      <span className="text-xs text-zinc-600">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {report.description && (
                      <p className="text-sm text-zinc-300 mt-2 p-3 bg-zinc-900 rounded border border-zinc-800">
                        "{report.description}"
                      </p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                      <button 
                        onClick={() => handleAction(report, 'HIDE_CONTENT')}
                        className="text-xs font-medium px-3 py-1.5 bg-red-900/20 text-red-400 border border-red-900/50 rounded hover:bg-red-900/40 transition"
                      >
                        Hide Content
                      </button>
                      <button 
                        onClick={() => handleAction(report, 'SUSPEND_USER')}
                        className="text-xs font-medium px-3 py-1.5 bg-orange-900/20 text-orange-400 border border-orange-900/50 rounded hover:bg-orange-900/40 transition"
                      >
                        Suspend User
                      </button>
                      <button 
                        onClick={() => handleViewTrust(report.reporterId)}
                        className="text-xs font-medium px-3 py-1.5 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded hover:bg-blue-900/40 transition"
                      >
                        Reporter Trust
                      </button>
                      <div className="flex-1"></div>
                      <button 
                        onClick={() => handleResolve(report.id, 'DISMISSED')}
                        className="text-xs font-medium px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-zinc-100 mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Open Reports</span>
                <span className="font-mono text-zinc-200">{reports.length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-6">
            <p className="text-emerald-400/90 text-sm leading-relaxed">
              <strong>Mod Tip:</strong> Remember that UniversiTea is for gossip. Only remove content that explicitly violates safety guidelines (e.g., Doxxing, Threats). Use your best judgment.
            </p>
          </div>
        </div>
      </div>

      {trustView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-lg shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setTrustView(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">✕</button>
            
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Internal Trust Profile</h2>
            
            <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-6">
              <div>
                <p className="text-sm text-zinc-400">Status</p>
                <p className={`font-bold ${trustView.profile.status === 'FLAGGED' ? 'text-red-400' : 'text-emerald-400'}`}>{trustView.profile.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Score</p>
                <p className="font-mono text-zinc-200">{trustView.profile.trustScore}</p>
              </div>
            </div>

            {trustView.signals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-red-400 mb-2">Abuse Signals</h3>
                <div className="space-y-2">
                  {trustView.signals.map((s: any) => (
                    <div key={s.id} className="text-xs bg-red-950/30 text-red-300 p-2 rounded border border-red-900/50 flex justify-between">
                      <span>{s.signalType}</span>
                      <span>{s.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-zinc-300 mb-2">Recent Events</h3>
              {trustView.events.length === 0 ? (
                <p className="text-xs text-zinc-500">No events found.</p>
              ) : (
                <div className="space-y-2">
                  {trustView.events.map((e: any) => (
                    <div key={e.id} className="text-xs bg-zinc-950 text-zinc-300 p-2 rounded flex justify-between border border-zinc-800">
                      <span>{e.eventType}</span>
                      <span className={e.pointsDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {e.pointsDelta > 0 ? '+' : ''}{e.pointsDelta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
