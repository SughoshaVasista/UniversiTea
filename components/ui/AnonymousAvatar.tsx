import React from 'react'

interface AnonymousAvatarProps {
  avatar: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AnonymousAvatar({
  avatar,
  size = 'md',
  className = '',
}: AnonymousAvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-2xl',
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-inner select-none transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      aria-label={`Anonymous Avatar ${avatar}`}
      role="img"
    >
      <span>{avatar}</span>
    </div>
  )
}
