'use client'

import React from 'react'

export function FirstSpillBanner() {
  return (
    <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl mb-4 flex items-start space-x-3">
      <span className="text-xl">🫖</span>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-emerald-300">Ready to spill tea?</h4>
        <p className="text-xs text-slate-300">
          Remember: rumors aren’t facts. Drop receipts when you have them to help get your tea verified!
        </p>
      </div>
    </div>
  )
}
