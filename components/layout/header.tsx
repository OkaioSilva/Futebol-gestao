import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getGameDays } from '@/lib/queries/game-days'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { HeaderAuthActions } from './header-auth-actions'

export async function Header() {
  const supabase = createClient()

  const [days, userResult] = await Promise.all([getGameDays(supabase), supabase.auth.getUser()])
  const user = userResult.data.user

  let adminName: string | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    adminName = data?.full_name ?? user.email ?? null
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-lg tracking-tight shrink-0">
          <span className="text-2xl leading-none">⚽</span>
          <span className="hidden sm:inline">Gestão do Futebol</span>
        </Link>

        <nav className="flex items-center gap-1">
          {days.map((day) => (
            <Link
              key={day.id}
              href={`/dia/${day.slug}`}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-fg hover:bg-surface-2 transition-colors duration-200"
            >
              {day.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <HeaderAuthActions adminName={adminName} />
        </div>
      </div>
    </header>
  )
}
