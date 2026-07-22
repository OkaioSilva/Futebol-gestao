export type PlayerStatus = 'pago' | 'nao_pago' | 'departamento_medico' | 'aviso_corte'
export type TransactionType = 'entrada' | 'saida'

export interface GameDay {
  id: string
  slug: string
  name: string
  monthly_fee: number
  updated_at: string
  last_payment_reset?: string | null
}

export interface Player {
  id: string
  day_id: string
  name: string
  status: PlayerStatus
  created_at: string
}

export interface Transaction {
  id: string
  day_id: string
  player_id: string | null
  type: TransactionType
  category: 'mensalidade' | 'visitante' | 'estorno' | 'outro'
  visitor_name: string | null
  visitor_date: string | null
  amount: number
  description: string
  period: string | null
  created_at: string
  admin_name: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
}
