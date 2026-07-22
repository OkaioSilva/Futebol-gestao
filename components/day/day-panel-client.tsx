'use client'

import { useState } from 'react'
import type { GameDay, Player, Transaction } from '@/lib/types'
import { useRealtimeDay } from '@/hooks/use-realtime-day'
import { useCurrentAdmin } from '@/hooks/use-current-admin'
import { FeeConfig } from './fee-config'
import { FinancialPanel } from './financial-panel'
import { PlayerTable } from './player-table'
import { AddPlayerDialog } from './add-player-dialog'
import { AddExpenseDialog } from './add-expense-dialog'
import { AddVisitorEntryDialog } from './add-visitor-entry-dialog'
import { AuditLog } from '@/components/audit/audit-log'

interface Props {
  day: GameDay
  initialPlayers: Player[]
  initialTransactions: Transaction[]
  initialIsAdmin: boolean
}

export function DayPanelClient({ day, initialPlayers, initialTransactions, initialIsAdmin }: Props) {
  // Usa a checagem client-side assim que ela terminar de carregar; até lá, confia no
  // hint vindo do servidor para evitar "flash" de botões de admin sumindo/aparecendo.
  const { isAdmin, loading } = useCurrentAdmin()
  const effectiveIsAdmin = loading ? initialIsAdmin : isAdmin

  const [fee, setFee] = useState(day.monthly_fee)
  const [selectedPeriod, setSelectedPeriod] = useState(() => new Date().toISOString().slice(0, 7))

  const { players, setPlayers, transactions, applyOptimisticStatus } = useRealtimeDay({
    dayId: day.id,
    initialPlayers,
    initialTransactions,
  })

  const monthlyTransactions = transactions.filter((tx) => {
    const periodString = tx.period ? String(tx.period) : ''
    if (periodString.startsWith(selectedPeriod)) return true

    if (!periodString) {
      const createdMonth = new Date(tx.created_at).toISOString().slice(0, 7)
      return createdMonth === selectedPeriod
    }

    return false
  })

  const totalEntradas = monthlyTransactions.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalSaidas = monthlyTransactions.filter((t) => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0)
  const saldo = totalEntradas - totalSaidas

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight">{day.name}</h1>
          <p className="text-muted text-sm mt-1">
            {players.length} jogador{players.length !== 1 ? 'es' : ''} na súmula
          </p>
        </div>
        <FeeConfig dayId={day.id} fee={fee} onFeeChange={setFee} isAdmin={effectiveIsAdmin} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label htmlFor="period" className="text-sm text-muted">Período</label>
          <input
            id="period"
            type="month"
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {effectiveIsAdmin && <AddVisitorEntryDialog dayId={day.id} period={selectedPeriod} />}
          {effectiveIsAdmin && <AddExpenseDialog dayId={day.id} period={selectedPeriod} />}
          {effectiveIsAdmin && <AddPlayerDialog dayId={day.id} />}
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Confirma resetar as marcações de mensalidade para este dia (isso não gerará entradas/saídas no caixa)?')) return
                try {
                  const res = await fetch('/api/reset-monthly', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dayId: day.id }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data?.error ?? 'Erro')
                  alert('Reset mensal aplicado com sucesso.')
                  location.reload()
                } catch (err: any) {
                  console.error(err)
                  alert('Falha ao aplicar reset: ' + (err?.message ?? err))
                }
              }}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm hover:bg-surface-2"
            >
              Reset Mensalidade
            </button>
          )}
        </div>
      </div>

      <FinancialPanel totalEntradas={totalEntradas} totalSaidas={totalSaidas} saldo={saldo} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-display font-semibold">Jogadores</h2>
          </div>
        </div>
        <PlayerTable
          players={players}
          isAdmin={effectiveIsAdmin}
          onOptimisticStatus={applyOptimisticStatus}
          onRemoved={(id) => setPlayers((prev) => prev.filter((p) => p.id !== id))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold">Histórico e Auditoria</h2>
        <AuditLog transactions={transactions} />
      </section>
    </div>
  )
}
