import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/getSession'
import { getCommunityBySlug } from '@/lib/community/getCommunity'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import { AnonymousAvatar } from '@/components/ui/AnonymousAvatar'
import { AnonymousPrivacyIndicator } from '@/components/ui/AnonymousPrivacyIndicator'
import { selectPersonaForThread } from '@/lib/identity/generator'

interface Props {
  params: Promise<{ communitySlug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { communitySlug } = await params
  const community = await getCommunityBySlug(communitySlug)

  if (!community) {
    notFound()
  }

  const session = await getSession()

  // Must be authenticated
  if (!session) {
    redirect('/auth/login')
  }

  // Contextual anonymous identity for this community
  const previewPersona = selectPersonaForThread(
    session.user.id,
    `preview_${community.id}`
  )

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            <AnonymousAvatar avatar={previewPersona.avatar} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Authenticated
                </span>
                <span className="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  r/{community.slug}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Welcome,</span>
                <span className="text-amber-400 font-mono">{previewPersona.name}</span>
                <span>{previewPersona.avatar}</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Member · {community.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/r/${community.slug}`}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              Public Feed
            </Link>
            <Link
              href="/auth/logout"
              className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-medium transition-colors"
            >
              Log Out
            </Link>
          </div>
        </div>

        {/* Anonymity Credentials & Privacy Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="text-zinc-500 mb-1">Contextual Thread Identity</div>
            <div className="text-amber-400 font-bold font-mono text-sm flex items-center gap-2">
              <span>{previewPersona.avatar}</span>
              <span>{previewPersona.name}</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Consistent in thread, shifts across threads</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="text-zinc-500 mb-1">Zero-Knowledge Verification</div>
            <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span>🛡️</span> 100% Cryptographic Anonymity
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">No email or student ID ever exposed</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="text-zinc-500 mb-1">Community</div>
            <div className="text-zinc-300 font-semibold">
              {community.collegeName || community.name}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">r/{community.slug}</div>
          </div>
        </div>

        <div className="mt-6">
          <AnonymousPrivacyIndicator variant="full" />
        </div>
      </div>

      {/* Student Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <h2 className="text-base font-bold text-white mb-2">Community Status</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            You are authorized to participate in discussions for {community.name}.
          </p>
          <div className="flex items-center gap-2">
            <VerificationBadge status="VERIFIED" />
            <VerificationBadge status="CHECKING" />
            <VerificationBadge status="DISPUTED" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-2">Quick Shortcuts</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Browse community updates or switch to the main directory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/r/${community.slug}`}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors"
            >
              Browse r/{community.slug} →
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs transition-colors"
            >
              Home Directory
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
