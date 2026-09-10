'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PostCard } from '../post/PostCard'
import { PostComposer } from '../post/PostComposer'
import { useRealTime } from '@/hooks/useRealTime'

interface FeedProps {
  communitySlug: string
  communityId: string
  isAuthenticated: boolean
}

export function Feed({ communitySlug, communityId, isAuthenticated }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [tab, setTab] = useState<'HOT' | 'NEW' | 'TRENDING' | 'VERIFIED'>('HOT')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { socket, isConnected } = useRealTime(communityId, null)
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchPosts = async (currentTab: string, currentCursor?: string) => {
    try {
      setLoading(true)
      // TRENDING is hot topics based on our new algorithm, fallback to NEW/HOT for normal feed
      const endpoint = currentTab === 'TRENDING' 
        ? `/api/communities/${communitySlug}/posts/trending` 
        : `/api/communities/${communitySlug}/posts?type=${currentTab}${currentCursor ? `&cursor=${currentCursor}` : ''}`
        
      const res = await fetch(endpoint)
      const data = await res.json()
      
      if (currentCursor && currentTab !== 'TRENDING') {
        setPosts(prev => [...prev, ...data.posts])
      } else {
        setPosts(data.posts || [])
      }
      
      setCursor(data.nextCursor || null)
      setHasMore(!!data.nextCursor && currentTab !== 'TRENDING')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'VERIFIED') {
      fetchPosts(tab)
    }
  }, [tab, communitySlug])

  useEffect(() => {
    if (!socket) return

    const handleNewPost = (newPost: any) => {
      if (tab === 'NEW') {
        setPosts(prev => [newPost, ...prev])
      }
    }

    const handleVoteUpdate = (data: { postId: string, score: number, upvotes: number, downvotes: number }) => {
      setPosts(prev => prev.map(p => p.id === data.postId ? { ...p, score: data.score, upvotes: data.upvotes, downvotes: data.downvotes } : p))
    }

    socket.on('NEW_POST', handleNewPost)
    socket.on('POST_VOTE_UPDATED', handleVoteUpdate)

    return () => {
      socket.off('NEW_POST', handleNewPost)
      socket.off('POST_VOTE_UPDATED', handleVoteUpdate)
    }
  }, [socket, tab])

  const handleVote = async (postId: string, value: 1 | -1 | 0) => {
    // Optimistic UI
    setPosts(posts.map(p => {
      if (p.id === postId) {
        // Calculate new score approximately (assuming previous vote was 0 for simplicity, real app needs user vote tracking)
        return { ...p, score: p.score + value }
      }
      return p
    }))

    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })
      if (response.status === 401) {
        router.push(`/auth/login?next=/r/${communitySlug}`)
      }
      // Optionally refresh to get true score
    } catch (err) {
      console.error(err)
      // Revert optimism if needed
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/r/${communitySlug}/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <form onSubmit={handleSearch} className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search the tea..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        <button type="submit" className="absolute right-3 top-3 text-zinc-500 hover:text-emerald-400">
          🔍
        </button>
      </form>

      <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setTab('HOT')}
          className={`font-medium pb-2 -mb-2.5 transition-colors ${tab === 'HOT' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🔥 Hot
        </button>
        <button 
          onClick={() => setTab('TRENDING')}
          className={`font-medium pb-2 -mb-2.5 transition-colors flex items-center gap-1 ${tab === 'TRENDING' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          📈 Trending {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Real-time Active"></span>}
        </button>
        <button 
          onClick={() => setTab('NEW')}
          className={`font-medium pb-2 -mb-2.5 transition-colors ${tab === 'NEW' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          🆕 New
        </button>
        <button 
          onClick={() => setTab('VERIFIED')}
          className={`font-medium pb-2 -mb-2.5 transition-colors ${tab === 'VERIFIED' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          ✅ Verified
        </button>
      </div>

      <PostComposer communitySlug={communitySlug} isAuthenticated={isAuthenticated} />

      {tab === 'VERIFIED' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center mt-6">
          <p className="text-zinc-400 mb-2">Verified feed is coming soon!</p>
          <p className="text-zinc-500 text-sm">Full evidence verification functionality arrives in the next phase.</p>
        </div>
      )}

      {tab !== 'VERIFIED' && (
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              communitySlug={communitySlug} 
              onVote={handleVote} 
            />
          ))}

          {loading && <p className="text-center text-zinc-500 py-4">Loading...</p>}

          {!loading && posts.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400 mb-4">No tea yet. Be the first to spill. 🫖</p>
            </div>
          )}

          {hasMore && (
            <button 
              onClick={() => fetchPosts(tab, cursor!)}
              className="py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full mx-auto my-4 transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  )
}
