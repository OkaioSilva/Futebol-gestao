'use client'

import { useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

export function AddPlayerDialog({ dayId }: { dayId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('players').insert({ day_id: dayId, name: name.trim() })
    setSaving(false)

    if (!error) {
      setName('')
      setOpen(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Adicionar Jogador
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar Jogador">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="player-name" className="text-sm text-muted block mb-1.5">
              Nome do jogador
            </label>
            <input
              id="player-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
