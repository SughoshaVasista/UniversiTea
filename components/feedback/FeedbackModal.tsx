'use client'

import React, { useState } from 'react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<'BUG' | 'FEATURE' | 'SAFETY' | 'OTHER'>('BUG')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Feedback submission failed')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setMessage('')
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-100">Send Feedback</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-bold">
            &times;
          </button>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-sm text-center">
            ✓ Feedback received! Thank you for helping improve UniversiTea.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="BUG">Bug Report</option>
                <option value="FEATURE">Feature Request</option>
                <option value="SAFETY">Safety Concern</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Tell us what's on your mind..."
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
