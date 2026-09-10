import React from 'react'

interface AnonymousNameProps {
  name: string
  isOP?: boolean
  className?: string
}

export function AnonymousName({
  name,
  isOP = false,
  className = '',
}: AnonymousNameProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
      <span className="text-zinc-200 hover:text-white font-semibold tracking-tight">
        {name}
      </span>
      {isOP && (
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
          OP
        </span>
      )}
    </span>
  )
}
