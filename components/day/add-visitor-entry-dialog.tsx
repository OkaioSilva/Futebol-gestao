'use client'

import { useState, type FormEvent } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

export function AddVisitorEntryDialog({ dayId, period }: { dayId: string; period: string }) {
  const [open, setOpen] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [visitorDate, setVisitorDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!visitorName.trim()) {
      setError('Nome do visitante obrigatório.')
      return
    }

    const parsedAmount = Number(amount.replace(',', '.'))
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
        type: 'entrada',
        category: 'visitante',
        visitorName: visitorName.trim(),
        visitorDate,
        amount: parsedAmount,
        description: description.trim() || `Entrada de visitante ${visitorName.trim()}`,
        period,
      }),
    })
    setSaving(false)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? 'Erro ao registrar entrada de visitante.')
      return
    }

    setVisitorName('')
    setAmount('')
    setDescription('')
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <User className="h-4 w-4" />
        Registrar Visitante
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar Entrada de Visitante">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="visitor-name" className="text-sm text-muted block mb-1.5">
              Nome do visitante
            </label>
            <input
              id="visitor-name"
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              placeholder="Ex: João (visitante)"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>

          <div>
            <label htmlFor="visitor-date" className="text-sm text-muted block mb-1.5">
              Data do visitante
            </label>
            <input
              id="visitor-date"
              type="date"
              value={visitorDate}
              onChange={(event) => setVisitorDate(event.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>

          <div>
            <label htmlFor="visitor-amount" className="text-sm text-muted block mb-1.5">
              Valor da diária
            </label>
            <input
              id="visitor-amount"
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
            <label htmlFor="visitor-description" className="text-sm text-muted block mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              id="visitor-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex: Pagamento de diária do visitante"
              rows={3}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand transition-colors duration-150"
            />
          </div>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !visitorName.trim() || !amount}>
              {saving ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
