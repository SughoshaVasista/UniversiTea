'use client'

import { useEffect, useState } from 'react'
import { useRealTime } from '@/hooks/useRealTime'
import Link from 'next/link'

interface NotificationBellProps {
  userId: string | null
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { socket } = useRealTime(null, userId)

  const fetchNotifications = async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/notifications`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications?.filter((n: any) => !n.readAt).length || 0)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (userId) fetchNotifications()
  }, [userId])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (notification: any) => {
      // Parse payload if it's a string from socket directly, but usually we parse in API. 
      // Let's assume it comes as an object or we parse it
      const newNotif = { ...notification, payload: typeof notification.payload === 'string' ? JSON.parse(notification.payload) : notification.payload }
      setNotifications(prev => [newNotif, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('NEW_NOTIFICATION', handleNewNotification)

    return () => {
      socket.off('NEW_NOTIFICATION', handleNewNotification)
    }
  }, [socket])

  const handleMarkAsRead = async () => {
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })))
    await fetch(`/api/notifications/read`, { method: 'POST' })
  }

  if (!userId) return null

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-zinc-900"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAsRead} className="text-xs text-emerald-400 hover:text-emerald-300">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">No new notifications</div>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className={`p-3 border-b border-zinc-800 text-sm ${notif.readAt ? 'opacity-60' : 'bg-zinc-800/30'}`}>
                  <p className="text-zinc-300">
                    {notif.payload.message}
                  </p>
                  <span className="text-xs text-zinc-500 mt-1 block" suppressHydrationWarning>
                    {new Date(notif.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
