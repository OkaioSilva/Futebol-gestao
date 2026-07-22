'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const e = params.get('error')
      if (e) setError(decodeURIComponent(e))
    } catch {}

    async function detectSession() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        console.log('getSession', { data, error })

        if (error) {
          setError(error.message)
          return
        }

        if (!data?.session) {
          setError('Sessão não encontrada. Use novamente o link do convite ou entre com um administrador.')
        }
      } catch (err: any) {
        console.error('getSession threw:', err)
      }
    }

    detectSession()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()
    try {
      const res = await supabase.auth.updateUser({ password })
      console.log('updateUser response:', res)
      setLoading(false)

      if (res.error) {
        setError(res.error.message)
        return
      }
    } catch (err: any) {
      console.error('updateUser threw:', err)
      setLoading(false)
      setError(String(err?.message ?? err))
      return
    }

    router.push('/admin/convites')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      <div>
        <label htmlFor="password" className="text-sm text-muted block mb-1.5">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="text-sm text-muted block mb-1.5">
          Confirmar senha
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
        />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button type="submit" className="w-full justify-center" disabled={loading}>
        {loading ? 'Salvando...' : 'Definir senha e entrar'}
      </Button>
    </form>
  )
}
