import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { searchPosts } from '@/lib/discovery/searchService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/post/PostCard'

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ communitySlug: string }>
  searchParams: Promise<{ q?: string; tag?: string; status?: string }>
}) {
  const { communitySlug } = await params
  const { q, tag, status } = await searchParams
  
  const community = await getCommunityBySlug(communitySlug)
  if (!community) return notFound()

  const tags = tag ? [tag] : []
  
  const { posts } = await searchPosts({
    communityId: community.id,
    query: q,
    tags,
    verificationStatus: status,
    limit: 50
  })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href={`/r/${communitySlug}`} className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 inline-block">
          ← Back to /r/{communitySlug}
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Search Results</h1>
        <div className="mt-2 text-sm text-zinc-400">
          {q && <span>Query: "{q}"</span>}
          {tag && <span className="ml-4">Tag: #{tag}</span>}
          {status && <span className="ml-4">Status: {status}</span>}
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p className="text-zinc-400">No tea matching that search.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} communitySlug={communitySlug} />
          ))
        )}
      </div>
    </div>
  )
}
