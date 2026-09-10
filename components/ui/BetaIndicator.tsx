'use client'

import React from 'react'

export function BetaIndicator() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span>CEC Beta</span>
    </div>
  )
}
