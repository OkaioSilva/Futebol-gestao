import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameDay } from '@/lib/types'

export async function getGameDays(supabase: SupabaseClient): Promise<GameDay[]> {
  const { data, error } = await supabase.from('game_days').select('*').order('name')
  if (error) throw error
  return data as GameDay[]
}

export async function getGameDayBySlug(supabase: SupabaseClient, slug: string): Promise<GameDay | null> {
  const { data, error } = await supabase.from('game_days').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data as GameDay | null
}
