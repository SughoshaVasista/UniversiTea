import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Gracefully fetch communities if database is connected, fallback gracefully
  let communities: Array<{ id: string; name: string; slug: string; description: string | null; status: string }> = []
  try {
    communities = await prisma.community.findMany({
      take: 6,
      orderBy: { name: 'asc' },
    })
  } catch {
    // If DB is offline or not migrated yet, default to CEC preview
    communities = [
      {
        id: 'seed-cec',
        name: 'City Engineering College',
        slug: 'cec',
        description: 'The unofficial student tea room.',
        status: 'VERIFIED',
      },
    ]
  }

  return (
    <main className="flex-1 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-amber-400 mb-6 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Phase 9 Live · Multi-Community Platform
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Universi<span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">Tea</span>
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-300 font-light max-w-2xl mx-auto mb-8 leading-relaxed">
            Your community. <span className="text-amber-400 font-semibold">Anonymously.</span>
          </p>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            The unvarnished community discussion network. Completely decoupled from your public identity. Zero names, zero handles, pure facts.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/r/cec"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 font-bold hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Enter r/cec</span>
              <span className="text-base font-black">→</span>
            </Link>

            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium transition-all"
            >
              <span>Sign In / Join</span>
            </Link>

            <Link
              href="/create-community"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-medium transition-all"
            >
              <span>🏛️ Create Community</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Communities */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Campuses on the Wire</h2>
            <p className="text-xs text-zinc-400">Discover active communities on the platform.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{communities.length} Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {communities.map((c) => (
            <Link
              key={c.slug}
              href={`/r/${c.slug}`}
              className="group p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                    r/{c.slug}
                  </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      Verified
                    </span>
                </div>
                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white mb-1.5">
                  {c.name}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {c.description || 'The unofficial student tea room.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 group-hover:text-amber-400/90 transition-colors">
                <span>Enter community</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full border-t border-zinc-900">
        <h2 className="text-center text-xs font-mono tracking-widest text-zinc-500 uppercase mb-8">
          The Architecture of Pure Anonymity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Passwordless Login</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We send a 6-digit cryptographic OTP to your email address to authenticate you securely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Decoupled Identity</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Once verified, your session is assigned an anonymous hash. Your real name is never stored with your posts or shown to peers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl bg-zinc-700/20 border border-zinc-700/30 text-zinc-300 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Community Fact-Checks</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Posts carry verification badges vetted by your campus peers &mdash; from &ldquo;Likely True&rdquo; to &ldquo;Disputed&rdquo; or &ldquo;Debunked&rdquo;.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
