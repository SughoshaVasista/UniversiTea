import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mb-6">
        🔍
      </div>
      <span className="font-mono text-xs text-rose-400 uppercase tracking-widest mb-2 font-semibold">
        404 · Community Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
        This Campus Hasn&apos;t Been Brewed
      </h1>
      <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
        The community slug you requested does not exist in the UniversiTea registry or has not been unlocked yet.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
        >
          ← Return Home
        </Link>
        <Link
          href="/r/cec"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors"
        >
          Visit r/cec →
        </Link>
      </div>
    </main>
  )
}
