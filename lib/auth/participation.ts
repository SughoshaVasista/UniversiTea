import { getSession } from './getSession'

/** Participation is gated by an active platform account, not college affiliation. */
export async function getParticipationSession() {
  const session = await getSession()

  if (!session || session.user.accountStatus !== 'ACTIVE') {
    return null
  }

  return session
}
