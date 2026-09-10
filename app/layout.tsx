import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { getSession } from '@/lib/auth/getSession'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'UniversiTea — Your College. Anonymously.',
  description:
    'An anonymous public discussion platform. Browse freely, then register to participate without college verification.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
        <header className="site-header sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-zinc-950 shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl font-bold leading-none">🍵</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                  UniversiTea
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono -mt-1">
                  Anonymous Campus Wire
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <NotificationBell userId={session?.user?.id || null} />
              <Link
                href="/home"
                className="hidden sm:inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-900"
              >
                <span>Home</span>
              </Link>
              <Link
                href="/settings"
                className="hidden sm:inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-900"
              >
                <span>Settings</span>
              </Link>
              
              <Link
                href="/r/cec"
                className="hidden sm:inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-900"
              >
                <span>r/cec</span>
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 transition-all shadow-sm"
              >
                <span>Student Login</span>
                <span className="text-amber-400">→</span>
              </Link>
            </nav>
          </div>
        </header>

        <ThemeProvider><div className="flex-1 flex flex-col">{children}</div></ThemeProvider>

        <footer className="border-t border-zinc-800/80 py-8 bg-zinc-950 text-zinc-500 text-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} UniversiTea. 100% Anonymous. Zero logs stored.</p>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Online
              </span>
              <Link href="/r/cec" className="hover:text-zinc-300 transition-colors">
                City Engineering College
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
