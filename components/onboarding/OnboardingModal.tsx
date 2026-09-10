'use client'

import React, { useState, useEffect } from 'react'

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('universitea_onboarding_seen')
    if (!hasSeenOnboarding) {
      setIsOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('universitea_onboarding_seen', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-slate-100 space-y-4">
        {step === 1 && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
              🫖
            </div>
            <h2 className="text-xl font-bold text-slate-100">Welcome to UniversiTea</h2>
            <p className="text-sm text-slate-300">
              Your anonymous campus tea room for <strong className="text-emerald-400">City Engineering College (/r/cec)</strong>.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-400 space-y-1">
              <p>🔒 <strong>Publicly Anonymous:</strong> Your real email & identity are never exposed.</p>
              <p>👥 <strong>Registered Participation:</strong> Anyone can browse publicly; register to post & comment.</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Next: Tea & Receipts →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
              🧾
            </div>
            <h2 className="text-xl font-bold text-slate-100">Rumors vs. Verification</h2>
            <p className="text-sm text-slate-300">
              On UniversiTea, popularity is not proof. Claims can be backed by receipts and community verification.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-400 space-y-1">
              <p>🟢 <strong>VERIFIED:</strong> Backed by official domain links or receipts.</p>
              <p>🟠 <strong>DISPUTED:</strong> Conflicting evidence submitted.</p>
              <p>⚪ <strong>UNVERIFIED:</strong> No corroborating receipts yet.</p>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Got it, enter /r/cec 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
