'use client'

import { useState } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatBRL } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  dayId: string
  fee: number
  onFeeChange: (value: number) => void
  isAdmin: boolean
}

export function FeeConfig({ dayId, fee, onFeeChange, isAdmin }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(fee.toString())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const parsed = Number(value.replace(',', '.'))
    if (Number.isNaN(parsed) || parsed < 0) return

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('game_days').update({ monthly_fee: parsed }).eq('id', dayId)
    setSaving(false)

    if (!error) {
      onFeeChange(parsed)
      setEditing(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <p className="text-xs text-muted uppercase tracking-wide">Mensalidade</p>
        <p className="text-xl font-mono font-semibold">{formatBRL(fee)}</p>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">Mensalidade</p>
          <p className="text-xl font-mono font-semibold">{formatBRL(fee)}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          aria-label="Editar valor da mensalidade"
          className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-fg transition-colors duration-150"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand bg-surface px-4 py-3 flex items-center gap-2">
      <span className="text-muted text-sm">R$</span>
      <input
        autoFocus
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 bg-transparent border-b border-border focus:border-brand outline-none text-lg font-mono font-semibold"
      />
      <Button size="sm" onClick={handleSave} disabled={saving} aria-label="Salvar valor">
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditing(false)
          setValue(fee.toString())
        }}
        aria-label="Cancelar edição"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
