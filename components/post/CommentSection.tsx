'use client'

import { useState, useEffect } from 'react'
import { AnonymousAuthor } from '@/components/ui/AnonymousAuthor'

interface CommentSectionProps {
  postId: string
  communitySlug: string
  isAuthenticated: boolean
}

export function CommentSection({ postId, communitySlug, isAuthenticated }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [pendingVotes, setPendingVotes] = useState<Set<string>>(new Set())

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId, communitySlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    try {
      await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId: replyTo })
      })
      setContent('')
      setReplyTo(null)
      fetchComments()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (commentId: string, currentVote: number, nextVote: 1 | -1) => {
    if (!isAuthenticated || pendingVotes.has(commentId)) return
    const value = currentVote === nextVote ? 0 : nextVote
    setPendingVotes((current) => new Set(current).add(commentId))
    setComments((current) => current.map((comment) => {
      if (comment.id !== commentId) return comment
      const previous = comment.userVote || 0
      return { ...comment, userVote: value, score: comment.score + value - previous }
    }))
    try {
      const response = await fetch(`/api/communities/${communitySlug}/posts/${postId}/comments/${commentId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not vote')
      if (data.score !== undefined) {
        setComments((current) => current.map((comment) => comment.id === commentId
          ? { ...comment, score: data.score, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote }
          : comment))
      } else {
        fetchComments()
      }
    } catch {
      fetchComments()
    } finally {
      setPendingVotes((current) => {
        const next = new Set(current)
        next.delete(commentId)
        return next
      })
    }
  }

  // Build tree for visually flattened nesting (max depth 1 for replies)
  const topLevel = comments.filter(c => !c.parentCommentId)
  const getReplies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId)

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800">
      <h3 className="text-xl font-semibold text-zinc-100 mb-6">Comments</h3>
      
      {isAuthenticated ? <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          placeholder="Add a comment..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 min-h-[100px] outline-none focus:border-emerald-500 transition-colors mb-3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div className="flex justify-between items-center">
          {replyTo && (
            <span className="text-sm text-zinc-400">
              Replying... <button type="button" onClick={() => setReplyTo(null)} className="text-emerald-500 hover:underline">Cancel</button>
            </span>
          )}
          {!replyTo && <span />}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-full transition-colors"
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </form> : (
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-400">Register for a free account to join the discussion.</p>
          <a href={`/auth/login?next=/r/${communitySlug}/post/${postId}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap">Register or sign in</a>
        </div>
      )}

      {loading && <p className="text-zinc-500">Loading comments...</p>}
      
      {!loading && comments.length === 0 && (
        <p className="text-zinc-500 text-center py-4">No comments yet.</p>
      )}

      <div className="flex flex-col gap-6">
        {topLevel.map(comment => (
          <div key={comment.id} className="flex flex-col gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AnonymousAuthor name={comment.author.anonymousName} avatar={comment.author.avatar} />
                <span className="text-xs text-zinc-500" suppressHydrationWarning>
                  {new Date(comment.createdAt).toLocaleDateString('en-US')}
                </span>
              </div>
              <p className="text-zinc-300">{comment.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs">
                <button disabled={pendingVotes.has(comment.id)} aria-label="Upvote comment" onClick={() => handleVote(comment.id, comment.userVote || 0, 1)} className={comment.userVote === 1 ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}>▲</button>
                <span className="text-zinc-400">{comment.score || 0}</span>
                <button disabled={pendingVotes.has(comment.id)} aria-label="Downvote comment" onClick={() => handleVote(comment.id, comment.userVote || 0, -1)} className={comment.userVote === -1 ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'}>▼</button>
                <button onClick={() => setReplyTo(comment.id)} className="text-zinc-500 hover:text-zinc-300 font-medium">Reply</button>
              </div>
            </div>
            
            {/* Replies */}
            <div className="ml-8 flex flex-col gap-2 border-l border-zinc-800 pl-4">
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <AnonymousAuthor name={reply.author.anonymousName} avatar={reply.author.avatar} />
                  </div>
                  <p className="text-zinc-300 text-sm">{reply.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <button disabled={pendingVotes.has(reply.id)} aria-label="Upvote reply" onClick={() => handleVote(reply.id, reply.userVote || 0, 1)} className={reply.userVote === 1 ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}>▲</button>
                    <span className="text-zinc-400">{reply.score || 0}</span>
                    <button disabled={pendingVotes.has(reply.id)} aria-label="Downvote reply" onClick={() => handleVote(reply.id, reply.userVote || 0, -1)} className={reply.userVote === -1 ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'}>▼</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
