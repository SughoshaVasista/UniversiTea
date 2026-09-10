import React from 'react'

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'CHECKING'
  | 'LIKELY'
  | 'VERIFIED'
  | 'DISPUTED'
  | 'FALSE'
  | 'REMOVED'

interface Props {
  status: VerificationStatus
  className?: string
}

const statusConfig: Record<
  VerificationStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  UNVERIFIED: {
    label: 'Unverified',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-400',
    border: 'border-zinc-700',
    dot: 'bg-zinc-500',
  },
  CHECKING: {
    label: 'Checking',
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-800/60',
    dot: 'bg-blue-400 animate-pulse',
  },
  LIKELY: {
    label: 'Likely True',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
  },
  VERIFIED: {
    label: 'Verified Tea',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  DISPUTED: {
    label: 'Disputed',
    bg: 'bg-orange-950/60',
    text: 'text-orange-400',
    border: 'border-orange-800/60',
    dot: 'bg-orange-400',
  },
  FALSE: {
    label: 'False / Debunked',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-800/60',
    dot: 'bg-rose-400',
  },
  REMOVED: {
    label: 'Removed',
    bg: 'bg-zinc-900',
    text: 'text-zinc-500',
    border: 'border-zinc-800',
    dot: 'bg-zinc-600',
  },
}

export function VerificationBadge({ status, className = '' }: Props) {
  const config = statusConfig[status] ?? statusConfig.UNVERIFIED

  return (
    <span
      data-testid="verification-badge"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
