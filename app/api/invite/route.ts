import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

function mapInviteErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('rate limit') || normalized.includes('request_rate_exceeded')) {
    return 'Taxa de envios do Supabase excedida. Aguarde alguns minutos antes de tentar novamente.'
  }
  if (normalized.includes('already invited') || normalized.includes('duplicate')) {
    return 'Já existe um convite válido para este e-mail. Aguarde o destinatário usar o link ou cancele o convite no Supabase.'
  }
  if (normalized.includes('invalid email') || normalized.includes('invalid')) {
    return 'E-mail inválido para envio de convite.'
  }

  return `Erro ao enviar convite: ${message}`
}

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  // 1. Confirma que quem está chamando essa rota é um administrador autenticado
  //    ANTES de usar a service role key. Essa checagem é o que impede qualquer
  //    visitante de convidar a si mesmo direto pela API.
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: 'Apenas administradores podem convidar.' }, { status: 403 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  const { data: existingInvite } = await supabase
    .from('admin_invites')
    .select('status')
    .eq('email', normalizedEmail)
    .eq('status', 'pendente')
    .maybeSingle()

  if (existingInvite) {
    return NextResponse.json(
      { error: 'Já existe um convite pendente para este e-mail. Aguarde alguns minutos antes de reenviar.' },
      { status: 409 },
    )
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ error: 'Este e-mail já está registrado como administrador.' }, { status: 409 })
  }

  // 2. Só agora usamos a chave de serviço, exclusivamente neste código de servidor,
  //    para disparar o e-mail de convite via Supabase Auth Admin API.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Configuração do Supabase incorreta: URL ou chave de serviço ausente.' }, { status: 500 })
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const redirectHost = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const redirectTo = `${redirectHost.replace(/\/$/, '')}/auth/callback`
  console.log('invite redirectTo', redirectTo)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, { redirectTo })
  console.log('invite result', { inviteData, inviteError, email, redirectTo })

  if (inviteError) {
    const mappedError = mapInviteErrorMessage(inviteError.message)
    console.error('invite error details:', { message: inviteError.message, mappedError, email, redirectTo })
    return NextResponse.json({ error: mappedError }, { status: 400 })
  }

  await supabase.from('admin_invites').insert({ email: normalizedEmail, invited_by: profile.id })

  return NextResponse.json({ success: true })
}
