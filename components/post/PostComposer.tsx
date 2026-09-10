'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnonymousPrivacyIndicator } from '@/components/ui/AnonymousPrivacyIndicator'

export function PostComposer({ communitySlug, isAuthenticated }: { communitySlug: string; isAuthenticated: boolean }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('HOT_TEA')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (!isAuthenticated) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-zinc-100 font-semibold">Want to participate?</p>
            <p className="text-sm text-zinc-400 mt-1">Browsing is public. Register for a free UniversiTea account to post, comment, and vote.</p>
          </div>
          <button type="button" onClick={() => router.push(`/auth/login?next=/r/${communitySlug}`)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-5 rounded-full transition-colors whitespace-nowrap">
            Register or sign in
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to spill tea')

      setTitle('')
      setContent('')
      setCategory('HOT_TEA')
      router.refresh() // Refresh the page to show new post in feed
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          className="bg-transparent border-b border-zinc-800 p-2 text-zinc-100 outline-none focus:border-emerald-500 transition-colors"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
        />
        <textarea
          placeholder="Spill the tea..."
          className="bg-transparent border border-zinc-800 rounded-lg p-3 text-zinc-100 min-h-[100px] outline-none focus:border-emerald-500 transition-colors"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-zinc-800 text-sm text-zinc-300 rounded-md p-2 outline-none border border-transparent focus:border-emerald-500"
            >
              <option value="HOT_TEA">🔥 Hot Tea</option>
              <option value="CAMPUS">🏛️ Campus</option>
              <option value="ACADEMICS">📚 Academics</option>
              <option value="FACULTY">👨‍🏫 Faculty</option>
              <option value="EVENTS">🎉 Events</option>
              <option value="PLACEMENTS">💼 Placements</option>
              <option value="RELATIONSHIPS">❤️ Relationships</option>
              <option value="RUMOURS">👀 Rumours</option>
              <option value="IMPORTANT">⚠️ Important</option>
              <option value="FUNNY">😂 Funny</option>
            </select>
            <AnonymousPrivacyIndicator />
          </div>
          
          <button
            type="submit"
            disabled={loading || title.length < 3 || content.length < 10}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium py-2 px-6 rounded-full transition-colors whitespace-nowrap"
          >
            {loading ? 'Spilling...' : 'Spill the Tea'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  )
}
