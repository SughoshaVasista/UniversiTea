'use client'

import { useState } from 'react'

interface ReportDialogProps {
  targetType: 'POST' | 'COMMENT' | 'RECEIPT'
  targetId: string
  communitySlug: string
  onClose: () => void
}

export function ReportDialog({ targetType, targetId, communitySlug, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState('HARASSMENT')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/communities/${communitySlug}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, description })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit report')

      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 border border-emerald-900/50 p-6 rounded-xl w-full max-w-md text-center shadow-xl">
          <p className="text-emerald-400 font-medium text-lg mb-2">Report Submitted</p>
          <p className="text-zinc-400 text-sm">Thanks. The moderation team will review this.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">✕</button>
        
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Report {targetType.toLowerCase()}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Why are you reporting this?</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-red-500 text-sm"
            >
              <option value="HARASSMENT">Harassment or Bullying</option>
              <option value="DOXXING">Doxxing or Private Information</option>
              <option value="THREAT">Threat of Violence</option>
              <option value="HATE">Hate Speech</option>
              <option value="FAKE_EVIDENCE">Fake Evidence</option>
              <option value="HARMFUL_ALLEGATION">Harmful Targeted Allegation</option>
              <option value="SPAM">Spam</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Optional Details</label>
            <textarea
              placeholder="Provide more context..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 min-h-[100px] outline-none focus:border-red-500 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm p-2 bg-red-950/30 rounded">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
