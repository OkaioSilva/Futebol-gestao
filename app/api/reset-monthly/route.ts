import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const dayId = body?.dayId

  if (!dayId || typeof dayId !== 'string') {
    return NextResponse.json({ error: 'dayId obrigatório.' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: 'Apenas administradores podem executar reset mensal.' }, { status: 403 })
  }

  const { error } = await supabase.rpc('reset_monthly_for_day', { p_day_id: dayId })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
