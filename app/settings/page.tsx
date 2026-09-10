import { redirect } from 'next/navigation'
import { getParticipationSession } from '@/lib/auth/participation'
import { SettingsPanel } from '@/components/settings/SettingsPanel'

export default async function SettingsPage() {
  const session = await getParticipationSession()
  if (!session) redirect('/auth/login?next=/settings')
  return <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10"><p className="eyebrow">Private account controls</p><h1 className="text-3xl font-bold mt-2">Settings</h1><p className="text-muted mt-2 mb-8">Your account and anonymous presentation stay private.</p><SettingsPanel /></main>
}
