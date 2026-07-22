'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/constants'
import type { PlayerStatus } from '@/lib/types'
import { StatusBadge } from './status-badge'

interface Props {
  value: PlayerStatus
  onChange: (status: PlayerStatus) => void
}

export function StatusSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity duration-150"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusBadge status={value} />
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-2 right-0 w-56 rounded-xl border border-border bg-surface shadow-lg p-1.5 space-y-0.5"
        >
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              role="option"
              aria-selected={status === value}
              onClick={() => {
                onChange(status)
                setOpen(false)
              }}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm hover:bg-surface-2 transition-colors duration-150 flex items-center gap-2 ${
                status === value ? 'bg-surface-2' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].dotClass}`} aria-hidden="true" />
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
