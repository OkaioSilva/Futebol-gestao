import { createClient } from '@/lib/supabase/server'
import { getGameDays } from '@/lib/queries/game-days'
import { DayCard } from '@/components/day/day-card'

export default async function HomePage() {
  const supabase = createClient()
  const days = await getGameDays(supabase)

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2 py-6">
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">Escolha o dia de jogo</h1>
        <p className="text-muted max-w-xl mx-auto">
          Presença e finanças em tempo real. Qualquer pessoa pode visualizar; apenas administradores editam.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {days.map((day) => (
          <DayCard key={day.id} day={day} />
        ))}
      </div>
    </div>
  )
}
