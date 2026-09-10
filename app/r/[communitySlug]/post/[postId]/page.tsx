import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { getPostById } from '@/lib/post/postService'
import { AnonymousAuthor } from '@/components/ui/AnonymousAuthor'
import { VerificationBadge, type VerificationStatus } from '@/components/ui/VerificationBadge'
import { CommentSection } from '@/components/post/CommentSection'
import { TeaCheck } from '@/components/verification/TeaCheck'
import { getSession } from '@/lib/auth/getSession'

interface Props {
  params: Promise<{ communitySlug: string, postId: string }>
}

export default async function PostDetailPage({ params }: Props) {
  const { communitySlug, postId } = await params
  
  const community = await getCommunityBySlug(communitySlug)
  if (!community) notFound()

  const session = await getSession()
  const post = await getPostById(postId, community.id, session?.user.id)
  if (!post) notFound()

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <Link href={`/r/${communitySlug}`} className="text-emerald-500 hover:underline mb-6 inline-block">
        ← Back to r/{communitySlug}
      </Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          {post.anonymousIdentity ? (
            <AnonymousAuthor 
              name={post.anonymousIdentity.name} 
              avatar={post.anonymousIdentity.avatar} 
              isOP={true} 
            />
          ) : (
            <AnonymousAuthor name="Anonymous Student" avatar="🎓" />
          )}
          <span className="text-xs text-zinc-500">
            {post.createdAt.toLocaleDateString()}
          </span>
        </div>

        <div className="mb-4">
          <span className="text-xs font-medium px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md mb-3 inline-block">
            {post.category}
          </span>
          <h1 className="text-2xl font-bold text-zinc-100 mb-4">{post.title}</h1>
          <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <VerificationBadge status={(post.verificationStatus || 'UNVERIFIED') as VerificationStatus} />
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1">
              <span>↑</span> {post.score}
            </span>
            <span className="flex items-center gap-1">
              💬 {post._count.comments}
            </span>
          </div>
        </div>
      </div>

      <TeaCheck postId={post.id} communitySlug={communitySlug} initialVerificationStatus={post.verificationStatus} />
      <CommentSection postId={post.id} communitySlug={communitySlug} isAuthenticated={Boolean(session)} />
    </main>
  )
}
