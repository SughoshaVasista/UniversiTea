'use client'

import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useRealTime(communityId: string | null, userId: string | null) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Only connect once per app
    if (!socket) {
      socket = io() // Automatically connects to the host that serves the page
    }

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    if (socket.connected) setIsConnected(true)

    // Subscribe to channels based on passed IDs
    if (communityId) {
      socket.emit('subscribe_community', communityId)
    }
    if (userId) {
      socket.emit('subscribe_user', userId)
    }

    return () => {
      if (socket) {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
      }
    }
  }, [communityId, userId])

  return { socket, isConnected }
}
