'use client'

import Link from 'next/link'
import { AnonymousAuthor } from '@/components/ui/AnonymousAuthor'
import { VerificationBadge } from '@/components/ui/VerificationBadge'

interface PostCardProps {
  post: any
  communitySlug: string
  onVote?: (postId: string, value: 1 | -1 | 0) => void
  userVote?: 1 | -1 | 0
  votePending?: boolean
  canDelete?: boolean
  onDelete?: (postId: string) => void
}

export function PostCard({ post, communitySlug, onVote = () => {}, userVote = 0, votePending = false, canDelete = false, onDelete = () => {} }: PostCardProps) {
  const isUpvoted = userVote === 1
  const isDownvoted = userVote === -1

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-center justify-between mb-3">
        <AnonymousAuthor name={post.author.anonymousName} avatar={post.author.avatar} />
        <div className="flex items-center gap-2">
          {canDelete && <button type="button" onClick={() => onDelete(post.id)} className="text-xs text-zinc-500 hover:text-rose-400 transition-colors" aria-label="Delete tea">Delete</button>}
          <span className="text-xs font-medium px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md">
            {post.category}
          </span>
          <span className="text-xs text-zinc-500" suppressHydrationWarning>
            {new Date(post.createdAt).toLocaleDateString('en-US')}
          </span>
        </div>
      </div>
      
      <Link href={`/r/${communitySlug}/post/${post.id}`}>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">{post.title}</h3>
        <p className="text-zinc-400 text-sm mb-4 line-clamp-3">{post.content}</p>
      </Link>
      
      <div className="flex items-center justify-between">
        <VerificationBadge status={post.verificationStatus || 'UNVERIFIED'} />
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-800/50 rounded-full">
            <button disabled={votePending}
              onClick={() => onVote(post.id, isUpvoted ? 0 : 1)}
              aria-label={isUpvoted ? 'Remove upvote' : 'Upvote post'}
              className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isUpvoted ? 'text-emerald-500' : 'text-zinc-400 hover:text-emerald-400'}`}
            >
              ↑
            </button>
            <span className={`text-sm font-medium px-1 ${isUpvoted ? 'text-emerald-500' : isDownvoted ? 'text-red-500' : 'text-zinc-300'}`}>
              {post.score}
            </span>
            <button disabled={votePending}
              onClick={() => onVote(post.id, isDownvoted ? 0 : -1)}
              aria-label={isDownvoted ? 'Remove downvote' : 'Downvote post'}
              className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isDownvoted ? 'text-red-500' : 'text-zinc-400 hover:text-red-400'}`}
            >
              ↓
            </button>
          </div>
          
          <Link 
            href={`/r/${communitySlug}/post/${post.id}`}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            💬 <span className="text-sm font-medium">{post.commentCount}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
