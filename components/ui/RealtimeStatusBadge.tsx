'use client'

import React from 'react'

interface RealtimeStatusBadgeProps {
  isConnected: boolean
}

export function RealtimeStatusBadge({ isConnected }: RealtimeStatusBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span>{isConnected ? 'Live' : 'Reconnecting...'}</span>
    </div>
  )
}
