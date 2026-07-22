'use client'

import { useState, type FormEvent } from 'react'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

export function AddExpenseDialog({ dayId, period }: { dayId: string; period: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!description.trim()) {
      setError('Descrição obrigatória.')
      return
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Valor inválido.')
      return
    }

    setSaving(true)
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayId,
        type: 'saida',
        category: 'outro',
        amount: parsedAmount,
        description: description.trim(),
        period,
      }),
    })

    setSaving(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'Erro ao registrar saída.')
      return
    }

    setDescription('')
    setAmount('')
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <DollarSign className="h-4 w-4" />
        Registrar Saída
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar Saída de Caixa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-amount" className="text-sm text-muted block mb-1.5">
              Valor
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>

          <div>
            <label htmlFor="expense-description" className="text-sm text-muted block mb-1.5">
              Descrição
            </label>
            <textarea
              id="expense-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex: Compra de material, taxa do local..."
              rows={3}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !description.trim() || !amount}>
              {saving ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
