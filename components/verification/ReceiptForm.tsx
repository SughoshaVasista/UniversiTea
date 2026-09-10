'use client'

import { useState } from 'react'

interface ReceiptFormProps {
  postId: string
  communitySlug: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReceiptForm({ postId, communitySlug, onSuccess, onCancel }: ReceiptFormProps) {
  const [type, setType] = useState('OFFICIAL_SOURCE')
  const [description, setDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [supportsClaim, setSupportsClaim] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // In a real app with file upload, we'd handle FormData and upload to a secure endpoint first.
      // For this MVP, we simulate it with URL/description.
      const res = await fetch(`/api/communities/${communitySlug}/posts/${postId}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          sourceUrl,
          supportsClaim
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit receipt')

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-100">🧾 Drop Receipts</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">✕</button>
      </div>

      <div className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg mb-4">
        <p className="text-amber-400/90 text-xs">
          <strong>Privacy Warning:</strong> Ensure your receipt does not contain private information belonging to someone else. Your identity will remain hidden.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Evidence Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-emerald-500 text-sm"
          >
            <option value="OFFICIAL_SOURCE">Official Source (e.g., Notice)</option>
            <option value="PUBLIC_WEBPAGE">Public Webpage</option>
            <option value="DOCUMENT">Document</option>
            <option value="SCREENSHOT">Screenshot</option>
            <option value="PHOTO">Photo</option>
            <option value="FIRST_HAND">First-hand Account</option>
            <option value="SECOND_HAND">Second-hand Account</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Does this support or contradict the tea?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="radio" checked={supportsClaim} onChange={() => setSupportsClaim(true)} className="accent-emerald-500" />
              Corroborates (Supports)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="radio" checked={!supportsClaim} onChange={() => setSupportsClaim(false)} className="accent-emerald-500" />
              Contradicts (Challenges)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Description (Required)</label>
          <textarea
            required
            minLength={5}
            placeholder="Explain what this evidence shows..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 min-h-[80px] outline-none focus:border-emerald-500 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Source URL (Optional)</label>
          <input
            type="url"
            placeholder="https://..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-emerald-500 text-sm"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 mt-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Receipt'}
          </button>
        </div>
      </form>
    </div>
  )
}
