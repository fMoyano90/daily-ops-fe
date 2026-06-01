'use client'

import { useState } from 'react'
import { FinanceEntry, FinanceEntryCreate, FinanceEntryType } from '@/lib/types'
import { getTodayStr } from '@/lib/utils'

const EXPENSE_CATEGORIES = ['Luz', 'Agua', 'Gas', 'Comida', 'Transporte', 'Alquiler', 'Salud', 'Entretenimiento', 'Otro']
const INCOME_CATEGORIES = ['Sueldo', 'Freelance', 'Otro']
const CUSTOM_CATEGORY = '__custom__'

function getCategorySuggestions(type: FinanceEntryType) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

interface Props {
  initial?: FinanceEntry
  defaultDate?: string
  onSave: (data: FinanceEntryCreate) => Promise<void>
  onCancel: () => void
}

export function FinanceEntryForm({ initial, defaultDate, onSave, onCancel }: Props) {
  const today = defaultDate ?? getTodayStr()
  const initialType = initial?.type ?? 'expense'
  const initialCategory = initial?.category ?? ''
  const isInitialSuggestedCategory = initialCategory
    ? getCategorySuggestions(initialType).includes(initialCategory)
    : true
  const [type, setType] = useState<FinanceEntryType>(initialType)
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(isInitialSuggestedCategory ? initialCategory : CUSTOM_CATEGORY)
  const [customCategory, setCustomCategory] = useState(isInitialSuggestedCategory ? '' : initialCategory)
  const [date, setDate] = useState(initial?.date ?? today)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggestions = getCategorySuggestions(type)
  const effectiveCategory = category === CUSTOM_CATEGORY ? customCategory : category

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!effectiveCategory.trim()) return setError('Seleccioná o escribí una categoría')
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('El monto debe ser mayor a 0')
    setSaving(true)
    try {
      await onSave({
        date,
        type,
        amount: parsedAmount,
        category: effectiveCategory.trim(),
        description: description.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory(''); setCustomCategory('') }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === t ? (t === 'income' ? 'bg-[var(--success,#10b981)] text-white' : 'bg-[var(--danger,#ef4444)] text-white') : 'text-text-muted hover:text-text hover:bg-bg-muted'}`}
          >
            {t === 'income' ? 'Ingreso' : 'Gasto'}
          </button>
        ))}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Categoría</label>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCategory(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${category === s ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:border-accent hover:text-accent'}`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCategory(CUSTOM_CATEGORY)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${category === CUSTOM_CATEGORY ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:border-accent hover:text-accent'}`}
          >
            Personalizado
          </button>
        </div>
        {category === CUSTOM_CATEGORY && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Escribí la categoría..."
            maxLength={80}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
        )}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Monto</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nota (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Factura de marzo..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      </div>

      {error && <p className="text-sm text-[var(--danger,#ef4444)]">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  )
}
