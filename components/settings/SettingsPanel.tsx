'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ui/ThemeProvider'

const avatars = ['🐼', '🦊', '🦉', '🐯', '🐙', '🤖', '🌙', '⚡']

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('🐼')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    fetch('/api/account/settings').then((response) => response.json()).then((data) => {
      setHandle(data.user?.anonymousHandle || '')
      setBio(data.user?.profileBio || '')
      setAvatar(data.user?.profileAvatar || '🐼')
      if (['light', 'dark', 'system'].includes(data.user?.theme)) setTheme(data.user.theme)
    }).catch(() => {})
  }, [])

  const save = async () => {
    const response = await fetch('/api/account/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonymousHandle: handle, profileBio: bio, profileAvatar: avatar, theme }),
    })
    setSaved(response.ok ? 'Settings saved privately.' : 'Could not save settings.')
    window.setTimeout(() => setSaved(''), 2200)
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel p-5">
        <h2 className="text-lg font-semibold">Anonymous identity</h2>
        <p className="text-sm text-muted mt-1">UniversiTea is built for anonymous participation. Avoid real names, phone numbers, email addresses, or student IDs.</p>
        <label className="block text-sm mt-5">Display name<input value={handle} onChange={(event) => setHandle(event.target.value)} className="input-field mt-2" maxLength={40} /></label>
        <div className="mt-4"><span className="text-sm">Avatar</span><div className="flex flex-wrap gap-2 mt-2">{avatars.map((option) => <button key={option} type="button" aria-label={`Choose ${option} avatar`} onClick={() => setAvatar(option)} className={`avatar-choice ${avatar === option ? 'avatar-choice-active' : ''}`}>{option}</button>)}</div></div>
        <label className="block text-sm mt-4">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} className="input-field mt-2 min-h-20" maxLength={160} placeholder="Keep it anonymous." /></label>
      </section>
      <section className="surface-panel p-5">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex flex-wrap gap-2 mt-4">{(['light', 'dark', 'system'] as const).map((option) => <button key={option} type="button" onClick={() => setTheme(option)} className={`theme-choice ${theme === option ? 'theme-choice-active' : ''}`}>{option[0].toUpperCase() + option.slice(1)}</button>)}</div>
      </section>
      <button type="button" onClick={save} className="primary-button">Save settings</button>
      {saved && <p role="status" className="text-sm text-muted">{saved}</p>}
    </div>
  )
}
