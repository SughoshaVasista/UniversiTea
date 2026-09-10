'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [collegeName, setCollegeName] = useState('')
  const [slug, setSlug] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Auto-generate slug from college name
  function handleNameChange(value: string) {
    setCollegeName(value)
    if (!slug || slug === autoSlug(collegeName)) {
      setSlug(autoSlug(value))
    }
  }

  function autoSlug(name: string) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/communities/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeName: collegeName.trim(),
          requestedSlug: slug.trim(),
          website: website.trim() || undefined,
          location: location.trim() || undefined,
          emailDomain: emailDomain.trim() || undefined,
          description: description.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit application.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">Application Submitted!</h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto mb-6">
            Your application for <span className="font-mono text-amber-400">r/{slug}</span> has been submitted.
            You&apos;ll be notified when it&apos;s reviewed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors"
            >
              Back to Home
            </Link>
            <button
              onClick={() => { setSuccess(false); setCollegeName(''); setSlug(''); setDescription(''); }}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm border border-zinc-700 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-black text-2xl mx-auto mb-4 shadow-md">
              🏛️
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Create a Community
            </h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Apply to create a new campus community on UniversiTea.
              Once approved, your community will be live at <span className="font-mono text-amber-400">r/your-slug</span>.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="collegeName" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                College / University Name *
              </label>
              <input
                id="collegeName"
                type="text"
                required
                placeholder="e.g. RV College of Engineering"
                value={collegeName}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Community Slug *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-3 rounded-l-xl bg-zinc-800 border border-r-0 border-zinc-700 text-zinc-400 text-sm font-mono">r/</span>
                <input
                  id="slug"
                  type="text"
                  required
                  placeholder="rvce"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-r-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="A brief description of this campus community..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="emailDomain" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Email Domain
                </label>
                <input
                  id="emailDomain"
                  type="text"
                  placeholder="rvce.edu.in"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="Bangalore, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Website
              </label>
              <input
                id="website"
                type="url"
                placeholder="https://rvce.edu.in"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:brightness-110 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
