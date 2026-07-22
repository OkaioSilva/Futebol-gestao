import type { SupabaseClient } from '@supabase/supabase-js'
import type { Player } from '@/lib/types'

export async function getPlayers(supabase: SupabaseClient, dayId: string): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').eq('day_id', dayId).order('name')
  if (error) throw error
  return data as Player[]
}
