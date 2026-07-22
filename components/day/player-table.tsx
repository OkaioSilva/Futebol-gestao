import { Users } from 'lucide-react'
import type { Player, PlayerStatus } from '@/lib/types'
import { PlayerRow } from './player-row'

interface Props {
  players: Player[]
  isAdmin: boolean
  onOptimisticStatus: (playerId: string, status: PlayerStatus) => void
  onRemoved: (playerId: string) => void
}

export function PlayerTable({ players, isAdmin, onOptimisticStatus, onRemoved }: Props) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted flex flex-col items-center gap-2">
        <Users className="h-6 w-6" />
        <p>A súmula está vazia. {isAdmin ? 'Adicione o primeiro jogador para começar.' : 'Nenhum jogador cadastrado ainda.'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
            <th className="py-3 pl-4 pr-3 font-medium">#</th>
            <th className="py-3 pr-4 font-medium">Jogador</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            {isAdmin && <th className="py-3 pr-4" />}
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              shirtNumber={index + 1}
              isAdmin={isAdmin}
              onOptimisticStatus={onOptimisticStatus}
              onRemoved={onRemoved}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
