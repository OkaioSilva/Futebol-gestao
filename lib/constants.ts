import type { PlayerStatus } from './types'

export const STATUS_CONFIG: Record<PlayerStatus, { label: string; badgeClass: string; dotClass: string }> = {
  pago: {
    label: 'Pago',
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  nao_pago: {
    label: 'Não Pago',
    badgeClass:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
    dotClass: 'bg-rose-500',
  },
  departamento_medico: {
    label: 'Departamento Médico',
    badgeClass:
      'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
    dotClass: 'bg-sky-500',
  },
  aviso_corte: {
    label: 'Aviso de Possível Corte',
    badgeClass:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
}

export const STATUS_ORDER: PlayerStatus[] = ['pago', 'nao_pago', 'departamento_medico', 'aviso_corte']
