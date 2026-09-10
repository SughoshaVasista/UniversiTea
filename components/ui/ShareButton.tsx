'use client'

import React, { useState } from 'react'

interface ShareButtonProps {
  title: string
  url: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
        return
      } catch {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignored
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
    >
      <span>🔗</span>
      <span>{copied ? 'Link Copied!' : 'Share Tea'}</span>
    </button>
  )
}
