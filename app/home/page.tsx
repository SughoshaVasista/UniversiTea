import Link from 'next/link'
import { getParticipationSession } from '@/lib/auth/participation'
import { getPersonalizedFeed, FeedMode } from '@/lib/discovery/personalizedFeed'

export const dynamic = 'force-dynamic'

export default async function HomeFeedPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await getParticipationSession()
  const params = await searchParams
  const requested = (params.mode || 'HOME').toUpperCase()
  const mode: FeedMode = ['HOME', 'FOLLOWING', 'NEW', 'TRENDING'].includes(requested) ? requested as FeedMode : 'HOME'
  const posts = await getPersonalizedFeed({ userId: session?.user.id, mode: session ? mode : 'TRENDING' })

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-amber-400">UniversiTea home</p>
          <h1 className="text-3xl font-bold text-white mt-2">{session ? 'Your feed' : 'Public discussions'}</h1>
          <p className="text-sm text-zinc-400 mt-2">{session ? 'A clear, explainable mix of what matters to you.' : 'Browse trending public Tea without creating a profile.'}</p>
        </div>
        {!session && <Link href="/auth/login" className="text-sm text-emerald-400 hover:text-emerald-300">Register to personalize</Link>}
      </div>

      <nav className="flex gap-2 border-b border-zinc-800 mb-6 overflow-x-auto">
        {(['HOME', 'FOLLOWING', 'NEW', 'TRENDING'] as FeedMode[]).map((tab) => (
          <Link key={tab} href={`/home?mode=${tab}`} className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${mode === tab ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-zinc-200'}`}>
            {tab[0] + tab.slice(1).toLowerCase()}
          </Link>
        ))}
      </nav>

      <div className="space-y-4">
        {posts.map((post: any) => (
          <article key={post.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
              <Link href={`/r/${post.community.slug}`} className="text-amber-400 hover:text-amber-300">r/{post.community.slug}</Link>
              <span>{post.feedReason}</span>
            </div>
            <Link href={`/r/${post.community.slug}/post/${post.id}`} className="block mt-3">
              <h2 className="text-lg font-semibold text-zinc-100 hover:text-white">{post.title}</h2>
              <p className="text-sm text-zinc-400 mt-2 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
            </Link>
            <div className="flex items-center gap-4 text-xs text-zinc-500 mt-4 pt-3 border-t border-zinc-800">
              <span>{post.score} score</span><span>{post._count.comments} comments</span><span>{post.verificationStatus}</span>
            </div>
          </article>
        ))}
        {posts.length === 0 && <p className="text-center text-zinc-500 py-12">No discussions match this view yet.</p>}
      </div>
    </main>
  )
}
