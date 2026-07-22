import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import type { GameDay } from '@/lib/types'
import { formatBRL } from '@/lib/utils'

export function DayCard({ day }: { day: GameDay }) {
  return (
    <Link
      href={`/dia/${day.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4 hover:border-brand transition-colors duration-200"
    >
      <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
        <CalendarDays className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-xl font-display font-semibold">{day.name}</h2>
        <p className="text-sm text-muted mt-1">
          Mensalidade: <span className="font-mono">{formatBRL(day.monthly_fee)}</span>
        </p>
      </div>

      <div className="mt-auto flex items-center gap-1 text-sm font-medium text-brand">
        Ver painel do dia
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </div>
    </Link>
  )
}
