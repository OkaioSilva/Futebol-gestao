import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGameDayBySlug } from '@/lib/queries/game-days'
import { getPlayers } from '@/lib/queries/players'
import { getTransactions } from '@/lib/queries/transactions'
import { DayPanelClient } from '@/components/day/day-panel-client'

export default async function DayPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const day = await getGameDayBySlug(supabase, params.slug)
  if (!day) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se já passou para um novo mês desde o último reset deste dia, realiza o reset
  // automaticamente quando um administrador abrir a página do dia.
  try {
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
      if (profile) {
        const lastReset = day.last_payment_reset ? new Date(day.last_payment_reset) : null
        const currentMonth = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1))
        if (!lastReset || lastReset < currentMonth) {
          await supabase.rpc('reset_monthly_for_day', { p_day_id: day.id })
        }
      }
    }
  } catch (err) {
    // falhas aqui não bloqueiam a renderização; logs do servidor podem mostrar detalhes
    console.error('automatic monthly reset failed', err)
  }

  const [players, transactions] = await Promise.all([getPlayers(supabase, day.id), getTransactions(supabase, day.id)])

  return (
    <DayPanelClient day={day} initialPlayers={players} initialTransactions={transactions} initialIsAdmin={!!user} />
  )
}
