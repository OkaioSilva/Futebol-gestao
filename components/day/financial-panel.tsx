import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { formatBRL } from '@/lib/utils'

interface Props {
  totalEntradas: number
  totalSaidas: number
  saldo: number
}

export function FinancialPanel({ totalEntradas, totalSaidas, saldo }: Props) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <ScoreCard label="Total de Entradas" value={totalEntradas} icon={ArrowUpCircle} tone="entrada" />
      <ScoreCard label="Total de Saídas" value={totalSaidas} icon={ArrowDownCircle} tone="saida" />
      <ScoreCard label="Saldo em Caixa" value={saldo} icon={Wallet} tone="saldo" />
    </div>
  )
}

const TONE_STYLES = {
  entrada: { bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', value: 'text-emerald-600 dark:text-emerald-400' },
  saida: { bar: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', value: 'text-rose-600 dark:text-rose-400' },
  // O saldo é o número de destaque do painel — recebe o tom âmbar de placar luminoso.
  saldo: { bar: 'bg-accent', chip: 'bg-accent/10 text-accent', value: 'text-accent' },
} as const

function ScoreCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Wallet
  tone: keyof typeof TONE_STYLES
}) {
  const styles = TONE_STYLES[tone]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 flex items-center gap-4 transition-colors duration-200 dark:shadow-[0_0_30px_-14px_var(--color-brand)]">
      <span className={`absolute top-0 left-0 right-0 h-1 ${styles.bar}`} aria-hidden="true" />
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.chip}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-mono font-semibold tabular-nums ${styles.value}`}>{formatBRL(value)}</p>
      </div>
    </div>
  )
}
