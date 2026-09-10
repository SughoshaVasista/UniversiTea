'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !otp) {
      setErrorMessage('Please provide both your email and the 6-digit code.')
      return
    }

    if (otp.trim().length !== 6) {
      setErrorMessage('Verification code must be 6 digits.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Verification failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Success! Redirect to community dashboard
      const target = data.redirectTo || `/r/${data.communitySlug || 'cec'}/dashboard`
      router.push(target)
      router.refresh()
    } catch {
      setErrorMessage('Network error during verification. Please try again.')
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (!email) {
      setErrorMessage('Enter your email address first.')
      return
    }

    setIsResending(true)
    setErrorMessage(null)
    setResendStatus(null)

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to resend code.')
      } else {
        setResendStatus('A new code has been sent.')
      }
    } catch {
      setErrorMessage('Error requesting a new code.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl mx-auto mb-4">
            🔑
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Enter Verification Code
          </h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-mono text-amber-400 font-semibold">{email || 'your email'}</span>
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <span className="text-rose-400 font-bold">✕</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success / Resend Banner */}
        {resendStatus && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{resendStatus}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          {!initialEmail && (
            <div>
              <label
                htmlFor="verify-email"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <input
                id="verify-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="otp"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
            >
              6-Digit Security Code
            </label>
            <input
              id="otp"
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-700 text-center font-mono text-2xl tracking-[0.4em] font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <p className="text-[11px] text-zinc-500 mt-2 text-center">
              Expires in 10 minutes · Single-use authentication
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Confirm & Enter Campus</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Resend & navigation */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>

          <Link href="/auth/login" className="hover:text-zinc-200 transition-colors">
            Change email
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-sm">
            Loading verification portal...
          </div>
        }
      >
        <VerifyForm />
      </Suspense>
    </main>
  )
}
