'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function FollowControls({ slug, topics }: { slug: string; topics: Array<{ name: string; displayName: string }> }) {
  const [message, setMessage] = useState('')
  const router = useRouter()

  const follow = async (body: Record<string, string>) => {
    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (response.status === 401) {
      router.push(`/auth/login?next=/r/${slug}`)
      return
    }
    setMessage(response.ok ? 'Saved privately' : 'Could not save')
    window.setTimeout(() => setMessage(''), 1800)
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => follow({ action: 'FOLLOW_COMMUNITY', slug })} className="px-3 py-1.5 rounded-full border border-emerald-800/70 text-xs text-emerald-300 hover:bg-emerald-950/60">
        Follow community
      </button>
      {topics.slice(0, 5).map((topic) => (
        <button key={topic.name} type="button" onClick={() => follow({ action: 'FOLLOW_TOPIC', slug, topic: topic.name })} className="px-3 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 hover:border-amber-500/60 hover:text-amber-300">
          Follow {topic.displayName}
        </button>
      ))}
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </div>
  )
}
