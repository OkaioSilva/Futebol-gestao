import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction } from '@/lib/types'

export async function getTransactions(supabase: SupabaseClient, dayId: string): Promise<Transaction[]> {
  const { data, error } = await supabase.rpc('get_transactions_with_admin', { p_day_id: dayId })
  if (error) throw error
  return data as Transaction[]
}
