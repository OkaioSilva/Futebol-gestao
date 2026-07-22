'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function HeaderAuthActions({ adminName }: { adminName: string | null }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!adminName) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg transition-colors duration-200"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/admin/convites" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand">
        <ShieldCheck className="h-4 w-4" />
        {adminName}
      </Link>
      <button
        onClick={handleLogout}
        aria-label="Sair"
        className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-fg transition-colors duration-200"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
