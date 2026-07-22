import { STATUS_CONFIG } from '@/lib/constants'
import type { PlayerStatus } from '@/lib/types'

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}
