import { ArrowDownCircle, ArrowUpCircle, ScrollText } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import { formatBRL, formatDateTime } from '@/lib/utils'

export function AuditLog({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted flex flex-col items-center gap-2">
        <ScrollText className="h-6 w-6" />
        <p>Nenhuma movimentação registrada ainda. Assim que um pagamento for marcado, ele aparece aqui.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface divide-y divide-border max-h-[28rem] overflow-y-auto">
      {transactions.map((tx) => {
        const isEntrada = tx.type === 'entrada'
        const tone = isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'

        return (
          <div key={tx.id} className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 shrink-0 ${tone}`}>
              {isEntrada ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed">
                <span className={`font-mono font-semibold ${tone}`}>
                  {isEntrada ? '+' : '-'}
                  {formatBRL(tx.amount)}
                </span>
                <span className="text-muted mx-1.5">|</span>
                {tx.description}
                        {tx.visitor_name ? (
                  <>
                    <span className="text-muted mx-1.5">|</span>
                    <span className="font-medium">{tx.visitor_name}</span>
                  </>
                ) : null}
                {tx.visitor_date ? (
                  <>
                    <span className="text-muted mx-1.5">|</span>
                    <span className="text-muted">Data da visita:</span>{' '}
                    <span className="font-medium">{new Date(tx.visitor_date).toLocaleDateString('pt-BR')}</span>
                  </>
                ) : null}
                <span className="text-muted mx-1.5">|</span>
                <span className="text-muted">Mês:</span>{' '}
                <span className="font-medium">
                  {(() => {
                    const periodDate = tx.period ? new Date(tx.period) : null
                    if (periodDate && !Number.isNaN(periodDate.getTime())) {
                      return periodDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    }
                    const createdDate = new Date(tx.created_at)
                    return !Number.isNaN(createdDate.getTime())
                      ? createdDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                      : 'Sem período'
                  })()}
                </span>
                <span className="text-muted mx-1.5">|</span>
                <span className="text-muted">Adicionado por:</span>{' '}
                <span className="font-medium">{tx.admin_name}</span>
              </p>
              <p className="text-xs text-muted mt-1 font-mono">{formatDateTime(tx.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
