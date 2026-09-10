'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loginMode, setLoginMode] = useState<'email' | 'username'>('email')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to request verification code.')
        setIsLoading(false)
        return
      }

      // Success -> navigate to verify page with email in query param
      router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`)
    } catch {
      setErrorMessage('Network error occurred. Please check your connection.')
      setIsLoading(false)
    }
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!username || !password) {
      setErrorMessage('Please enter both username and password.')
      return
    }

    setIsLoading(true)

    if (isSignUp) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setErrorMessage(data.error || 'Registration failed.')
          setIsLoading(false)
          return
        }
        setSuccessMessage('Account created! You can now sign in.')
        setIsSignUp(false)
        setIsLoading(false)
        return
      } catch {
        setErrorMessage('Failed to register. Please try again.')
        setIsLoading(false)
        return
      }
    }

    // Sign In Flow
    try {
      const { signIn } = await import('next-auth/react')
      const res = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setErrorMessage(res.error)
        setIsLoading(false)
      } else {
        router.push('/')
      }
    } catch {
      setErrorMessage('Failed to sign in.')
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-black text-2xl mx-auto mb-4 shadow-md">
              🍵
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Sign In or Join
            </h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Enter your email address. We&apos;ll send a 6-digit one-time code to authenticate you.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Type Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'email' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Email Code
            </button>
            <button
              onClick={() => setLoginMode('username')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'username' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Username & Password
            </button>
          </div>

          {/* Form */}
          {loginMode === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                />
                <p className="text-[11px] text-zinc-500 mt-2">
                  Join thousands of students on UniversiTea.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="e.g. teststudent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isSignUp ? 'Signing up...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <span>→</span>
                  </>
                )}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}

          {/* Third-Party Account Providers */}
          <div className="mt-4">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-zinc-500 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  import('next-auth/react').then(({ signIn }) => signIn('google'));
                }}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  import('next-auth/react').then(({ signIn }) => signIn('azure-ad'));
                }}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue with Microsoft</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  import('next-auth/react').then(({ signIn }) => signIn('twitter'));
                }}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Continue with X (Twitter)</span>
              </button>

            </div>
          </div>

          {/* Anonymity Promise */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-left">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <span>🛡️</span>
                <span>Name & Email Redaction Guaranteed</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                If your email address contains your real name (e.g. <span className="font-mono text-zinc-300">john.doe@example.com</span>), UniversiTea converts it into a one-way cryptographic SHA-256 hash before saving anything. Your real name and address are <strong>never stored</strong> in the database.
              </p>
            </div>
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
