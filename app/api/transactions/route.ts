import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const { dayId, type, category, visitorName, visitorDate, amount, description, period } = body ?? {}

  if (!dayId || typeof dayId !== 'string') {
    return NextResponse.json({ error: 'Dia inválido.' }, { status: 400 })
  }

  if (!type || (type !== 'entrada' && type !== 'saida')) {
    return NextResponse.json({ error: 'Tipo de transação inválido.' }, { status: 400 })
  }

  const allowedCategories = ['mensalidade', 'visitante', 'estorno', 'outro'] as const
  if (!category || !allowedCategories.includes(category)) {
    return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 })
  }

  if (type === 'entrada' && category === 'visitante') {
    if (typeof visitorName !== 'string' || !visitorName.trim()) {
      return NextResponse.json({ error: 'Nome do visitante obrigatório para entradas de visitante.' }, { status: 400 })
    }
    if (!visitorDate || typeof visitorDate !== 'string' || Number.isNaN(new Date(visitorDate).getTime())) {
      return NextResponse.json({ error: 'Data do visitante inválida.' }, { status: 400 })
    }
  }

  if (typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'Descrição obrigatória.' }, { status: 400 })
  }

  const parsedAmount = Number(amount)
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'Valor inválido. Use um número maior que zero.' }, { status: 400 })
  }

  const transactionPeriod = period ? new Date(period) : new Date()
  if (Number.isNaN(transactionPeriod.getTime())) {
    return NextResponse.json({ error: 'Período inválido.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: 'Apenas administradores podem registrar saídas.' }, { status: 403 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Configuração do Supabase incorreta: URL ou chave de serviço ausente.' }, { status: 500 })
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.from('transactions').insert([
    {
      day_id: dayId,
      player_id: null,
      type,
      category,
      visitor_name: category === 'visitante' ? visitorName.trim() : null,
      visitor_date: category === 'visitante' ? new Date(visitorDate).toISOString().slice(0, 10) : null,
      amount: parsedAmount,
      description: description.trim(),
      period: new Date(Date.UTC(transactionPeriod.getFullYear(), transactionPeriod.getMonth(), 1)).toISOString().slice(0, 10),
      created_by: profile.id,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
