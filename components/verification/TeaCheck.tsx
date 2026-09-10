'use client'

import { useState, useEffect } from 'react'
import { ReceiptForm } from './ReceiptForm'
import { ReceiptCard } from './ReceiptCard'
import { VerificationBadge } from '@/components/ui/VerificationBadge'

interface TeaCheckProps {
  postId: string
  communitySlug: string
  initialVerificationStatus: string
}

export function TeaCheck({ postId, communitySlug, initialVerificationStatus }: TeaCheckProps) {
  const [receipts, setReceipts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchReceipts = async () => {
    try {
      const res = await fetch(`/api/communities/${communitySlug}/posts/${postId}/receipts`)
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [postId, communitySlug])

  const approvedReceipts = receipts.filter(r => r.status === 'APPROVED')
  const supportingCount = approvedReceipts.filter(r => r.supportsClaim).length
  const contradictingCount = approvedReceipts.filter(r => !r.supportsClaim).length

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          Tea Check <VerificationBadge status={initialVerificationStatus as any} />
        </h3>
        
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
          >
            🧾 Drop Receipts
          </button>
        )}
      </div>

      {showForm && (
        <ReceiptForm 
          postId={postId} 
          communitySlug={communitySlug} 
          onSuccess={() => {
            setShowForm(false)
            setLoading(true)
            fetchReceipts()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm py-4">Checking receipts...</p>
      ) : receipts.length === 0 ? (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center">
          <p className="text-zinc-400 text-sm">No verified receipts yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {receipts.some((receipt) => receipt.status === 'PENDING_REVIEW') && (
            <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl">
              <h4 className="text-sm font-semibold text-amber-300 mb-1">Pending review</h4>
              <p className="text-xs text-amber-200/70 mb-3">Your submitted receipt is visible to you while a moderator reviews it. It is not part of the public evidence count yet.</p>
              <div className="space-y-3">
                {receipts.filter((receipt) => receipt.status === 'PENDING_REVIEW').map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            {supportingCount > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-emerald-950/40 text-emerald-400 rounded-md border border-emerald-900/40">
                ✓ {supportingCount} Supporting
              </span>
            )}
            {contradictingCount > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-red-950/40 text-red-400 rounded-md border border-red-900/40">
                ⚠ {contradictingCount} Contradicting
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {receipts.filter((receipt) => receipt.status === 'APPROVED').map(receipt => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
