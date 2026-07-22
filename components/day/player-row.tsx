'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Player, PlayerStatus } from '@/lib/types'
import { StatusSelector } from './status-selector'
import { StatusBadge } from './status-badge'

interface Props {
  player: Player
  shirtNumber: number
  isAdmin: boolean
  onOptimisticStatus: (playerId: string, status: PlayerStatus) => void
  onRemoved: (playerId: string) => void
}

export function PlayerRow({ player, shirtNumber, isAdmin, onOptimisticStatus, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false)

  async function handleStatusChange(status: PlayerStatus) {
    const previousStatus = player.status
    onOptimisticStatus(player.id, status) // feedback instantâneo, sem esperar o servidor

    const supabase = createClient()
    const { error } = await supabase.from('players').update({ status }).eq('id', player.id)

    if (error) {
      onOptimisticStatus(player.id, previousStatus) // desfaz se o servidor recusar
    }
    // Em caso de sucesso, o trigger handle_player_status_change() já cuidou de lançar
    // a transação de entrada/estorno — o Realtime traz a atualização definitiva sozinho.
  }

  async function handleRemove() {
    if (!confirm(`Remover ${player.name} deste dia?`)) return

    setRemoving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', player.id)
    setRemoving(false)

    if (!error) onRemoved(player.id)
  }

  return (
    <tr className="border-b border-border last:border-0 group">
      <td className="py-3 pl-4 pr-3 w-12">
        <span className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-mono font-semibold text-muted">
          {shirtNumber}
        </span>
      </td>
      <td className="py-3 pr-4 font-medium">{player.name}</td>
      <td className="py-3 pr-4">
        {isAdmin ? <StatusSelector value={player.status} onChange={handleStatusChange} /> : <StatusBadge status={player.status} />}
      </td>
      {isAdmin && (
        <td className="py-3 pr-4 text-right">
          <button
            onClick={handleRemove}
            disabled={removing}
            aria-label={`Remover ${player.name}`}
            className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  )
}
