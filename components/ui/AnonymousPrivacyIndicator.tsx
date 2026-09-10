import React from 'react'

interface AnonymousPrivacyIndicatorProps {
  variant?: 'compact' | 'full'
  className?: string
}

export function AnonymousPrivacyIndicator({
  variant = 'compact',
  className = '',
}: AnonymousPrivacyIndicatorProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-[11px] font-medium text-zinc-300 shadow-sm ${className}`}
      >
        <span className="text-amber-400">🕵️</span>
        <span>Posting anonymously</span>
      </div>
    )
  }

  return (
    <div
      className={`p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/20 shadow-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-base flex-shrink-0">
          🕵️
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <span>Contextual Anonymity Active</span>
            <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
              Zero-PII
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
            Your real email, name, and user ID are strictly shielded. You appear as an anonymous persona (e.g. 🐼 Anonymous Panda) consistent within each post thread.
          </p>
        </div>
      </div>
    </div>
  )
}
