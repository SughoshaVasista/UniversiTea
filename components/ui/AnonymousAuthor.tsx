import React from 'react'
import { AnonymousAvatar } from './AnonymousAvatar'
import { AnonymousName } from './AnonymousName'

interface AnonymousAuthorProps {
  name: string
  avatar: string
  subtext?: string
  isOP?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function AnonymousAuthor({
  name,
  avatar,
  subtext,
  isOP = false,
  size = 'md',
  className = '',
}: AnonymousAuthorProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <AnonymousAvatar avatar={avatar} size={size} />
      <div className="flex flex-col leading-tight">
        <AnonymousName name={name} isOP={isOP} className={size === 'sm' ? 'text-xs' : 'text-sm'} />
        {subtext && <span className="text-[11px] text-zinc-500">{subtext}</span>}
      </div>
    </div>
  )
}
