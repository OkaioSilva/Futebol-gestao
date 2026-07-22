import { redirect } from 'next/navigation'
import { Clock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InviteAdminForm } from '@/components/admin/invite-admin-form'
import { formatDateTime } from '@/lib/utils'

export default async function ConvitesPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/login')

  const [{ data: admins }, { data: invites }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at').order('created_at'),
    supabase.from('admin_invites').select('id, email, status, created_at').eq('status', 'pendente').order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-semibold">Administradores</h1>
        <p className="text-muted text-sm mt-1">Convide outras pessoas do grupo para administrar os dados junto com você.</p>
      </div>

      <InviteAdminForm />

      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Administradores ativos</h2>
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
          {admins?.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
              <div>
                <p className="text-sm font-medium">{a.full_name}</p>
                <p className="text-xs text-muted">{a.email}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {invites && invites.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Convites pendentes</h2>
          <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-4">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{i.email}</p>
                  <p className="text-xs text-muted">Enviado em {formatDateTime(i.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
