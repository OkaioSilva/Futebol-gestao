'use client'

import { useState, type FormEvent } from 'react'
import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InviteAdminForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setMessage('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => undefined)
      console.log('invite response', res.status, data)

      if (res.ok) {
        setStatus('sent')
        setMessage(`Convite enviado para ${email}.`)
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data?.error ?? `Erro ao enviar convite (status ${res.status}).`)
      }
    } catch (err: any) {
      console.error('invite fetch error:', err)
      setStatus('error')
      setMessage(String(err?.message ?? 'Erro de rede ao enviar convite.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex items-center gap-2 font-display font-semibold">
        <Mail className="h-4 w-4 text-brand" />
        Convidar novo administrador
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
        />
        <Button type="submit" disabled={status === 'saving'}>
          <Send className="h-4 w-4" />
          {status === 'saving' ? 'Enviando...' : 'Convidar'}
        </Button>
      </div>
      {message && <p className={`text-sm ${status === 'error' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>{message}</p>}
    </form>
  )
}
