import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { AnonymousPrivacyIndicator } from '@/components/ui/AnonymousPrivacyIndicator'
import { Feed } from '@/components/feed/Feed'
import { getSession } from '@/lib/auth/getSession'
import { getPopularTags } from '@/lib/discovery/searchService'
import { FollowControls } from '@/components/community/FollowControls'

interface Props {
  params: Promise<{ communitySlug: string }>
}

export default async function CommunityPage({ params }: Props) {
  const { communitySlug } = await params
  const community = await getCommunityBySlug(communitySlug)

  if (!community) {
    notFound()
  }

  const session = await getSession()
  const popularTags = await getPopularTags(community.id, 8).catch(() => [])

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      {/* Community Banner / Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                r/{community.slug}
              </span>
              {community.status === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified Community
                </span>
              )}
              {community.emailDomain && (
                <span className="font-mono text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700/60">
                  @{community.emailDomain}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {community.name}
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              {community.description || 'The unofficial student tea room. Share insights, campus alerts, and questions.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href={`/r/${community.slug}/dashboard`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <span>Student Dashboard</span>
              <span>🔒</span>
            </Link>
          </div>

          <FollowControls
            slug={community.slug}
            topics={popularTags.map((tag) => ({ name: tag.name, displayName: tag.displayName }))}
          />
        </div>

        {/* Community Quick Stats & Privacy Guarantee */}
        <div className="pt-4 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-zinc-500">Institution:</span>{' '}
              <span className="text-zinc-200 font-medium">{community.collegeName}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-500">Access:</span>{' '}
              <span className="text-emerald-400 font-medium">Public to browse</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div>
              <span className="text-zinc-500">Identity:</span>{' '}
              <span className="text-amber-400 font-medium">Contextually Anonymous</span>
            </div>
          </div>

          <AnonymousPrivacyIndicator variant="compact" />
        </div>
      </div>

      <Feed communitySlug={community.slug} communityId={community.id} isAuthenticated={Boolean(session)} />
    </main>
  )
}
