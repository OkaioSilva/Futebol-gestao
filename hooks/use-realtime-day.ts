'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Player, PlayerStatus, Transaction } from '@/lib/types'

interface Params {
  dayId: string
  initialPlayers: Player[]
  initialTransactions: Transaction[]
}

/**
 * Fonte única de verdade para o painel de um dia. Assina mudanças em tempo real
 * (players + transactions) filtradas por day_id, garantindo que visitantes vejam os
 * dados ao vivo e que o caixa de um dia nunca apareça misturado com o de outro.
 */
export function useRealtimeDay({ dayId, initialPlayers, initialTransactions }: Params) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const supabaseRef = useRef(createClient())

  // Se o usuário navegar entre dias (Terça -> Quarta) sem reload completo, reseta o estado local.
  useEffect(() => {
    setPlayers(initialPlayers)
    setTransactions(initialTransactions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId])

  useEffect(() => {
    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`day-${dayId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `day_id=eq.${dayId}` },
        (payload) => {
          setPlayers((prev) => {
            if (payload.eventType === 'INSERT') {
              const incoming = payload.new as Player
              if (prev.some((p) => p.id === incoming.id)) return prev
              return [...prev, incoming].sort((a, b) => a.name.localeCompare(b.name))
            }
            if (payload.eventType === 'UPDATE') {
              const incoming = payload.new as Player
              return prev.map((p) => (p.id === incoming.id ? incoming : p))
            }
            if (payload.eventType === 'DELETE') {
              const removed = payload.old as Player
              return prev.filter((p) => p.id !== removed.id)
            }
            return prev
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `day_id=eq.${dayId}` },
        async () => {
          // Refaz a busca via RPC para trazer o nome do admin já unido (join).
          const { data } = await supabase.rpc('get_transactions_with_admin', { p_day_id: dayId })
          if (data) setTransactions(data as Transaction[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dayId])

  // Aplica a mudança de status imediatamente na UI (antes da confirmação do servidor),
  // eliminando qualquer sensação de travamento ao marcar um pagamento.
  const applyOptimisticStatus = useCallback((playerId: string, status: PlayerStatus) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, status } : p)))
  }, [])

  const totalEntradas = transactions.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalSaidas = transactions.filter((t) => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    players,
    setPlayers,
    transactions,
    applyOptimisticStatus,
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
  }
}
