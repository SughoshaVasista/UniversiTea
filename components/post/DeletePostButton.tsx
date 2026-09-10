'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeletePostButton({ communitySlug, postId }: { communitySlug: string; postId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const deletePost = async () => {
    if (!window.confirm('Delete this tea? It will disappear from the community.')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        window.alert(data.error || 'Could not delete tea')
        return
      }
      router.push(`/r/${communitySlug}`)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }
  return <button type="button" disabled={deleting} onClick={deletePost} className="text-xs text-zinc-500 hover:text-rose-400 disabled:opacity-50" aria-label="Delete tea">{deleting ? 'Deleting...' : 'Delete tea'}</button>
}
