'use client'

import { useState } from 'react'
import { FinanceEntry, FinanceEntryCreate, FinanceEntryKind, FinanceEntryType } from '@/lib/types'
import { getTodayStr } from '@/lib/utils'

type FinanceEntryMode = FinanceEntryType | 'credit_purchase' | 'loan_given'

const EXPENSE_CATEGORIES = ['Luz', 'Agua', 'Gas', 'Comida', 'Transporte', 'Alquiler', 'Salud', 'Entretenimiento', 'Prestamo', 'Otro']
const INCOME_CATEGORIES = ['Sueldo', 'Freelance', 'Otro']
const CUSTOM_CATEGORY = '__custom__'

function getCategorySuggestions(type: FinanceEntryType) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

function getMode(entry?: FinanceEntry): FinanceEntryMode {
  if (entry?.kind === 'credit_purchase' || entry?.kind === 'loan_given') return entry.kind
  return entry?.type ?? 'expense'
}

function getKind(mode: FinanceEntryMode): FinanceEntryKind {
  if (mode === 'credit_purchase' || mode === 'loan_given') return mode
  return 'cash'
}

interface Props {
  initial?: FinanceEntry
  defaultDate?: string
  showDecimals: boolean
  onSave: (data: FinanceEntryCreate) => Promise<void>
  onCancel: () => void
}

export function FinanceEntryForm({ initial, defaultDate, showDecimals, onSave, onCancel }: Props) {
  const today = defaultDate ?? getTodayStr()
  const initialMode = getMode(initial)
  const initialType: FinanceEntryType = initialMode === 'income' ? 'income' : 'expense'
  const initialCategory = initial?.category ?? ''
  const isInitialSuggestedCategory = initialCategory
    ? getCategorySuggestions(initialType).includes(initialCategory)
    : true
  const [mode, setMode] = useState<FinanceEntryMode>(initialMode)
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(isInitialSuggestedCategory ? initialCategory : CUSTOM_CATEGORY)
  const [customCategory, setCustomCategory] = useState(isInitialSuggestedCategory ? '' : initialCategory)
  const [date, setDate] = useState(initial?.date ?? today)
  const [person, setPerson] = useState(initial?.person ?? '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const type: FinanceEntryType = mode === 'income' ? 'income' : 'expense'
  const kind = getKind(mode)
  const suggestions = getCategorySuggestions(type)
  const effectiveCategory = category === CUSTOM_CATEGORY ? customCategory : category
  const needsPerson = mode === 'loan_given'
  const showsTrackingFields = mode === 'credit_purchase' || mode === 'loan_given'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!effectiveCategory.trim()) return setError('Seleccioná o escribí una categoría')
    if (needsPerson && !person.trim()) return setError('Indicá a quién le prestaste')
    if (isNaN(parsedAmount) || parsedAmount <= 0) return setError('El monto debe ser mayor a 0')
    if (!showDecimals && !Number.isInteger(parsedAmount)) return setError('El monto debe ser un número entero')
    setSaving(true)
    try {
      await onSave({
        date,
        type,
        kind,
        amount: parsedAmount,
        category: effectiveCategory.trim(),
        affects_balance: mode !== 'credit_purchase',
        person: person.trim() || null,
        due_date: dueDate || null,
        status: mode === 'credit_purchase' || mode === 'loan_given' ? 'open' : 'posted',
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
        {([
          ['expense', 'Gasto'],
          ['income', 'Ingreso'],
          ['credit_purchase', 'Crédito'],
          ['loan_given', 'Préstamo'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); setCategory(value === 'loan_given' ? 'Prestamo' : ''); setCustomCategory(''); setPerson(''); setDueDate('') }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === value ? (value === 'income' ? 'bg-[var(--success,#10b981)] text-white' : value === 'expense' ? 'bg-[var(--danger,#ef4444)] text-white' : 'bg-accent text-white') : 'text-text-muted hover:text-text hover:bg-bg-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'credit_purchase' && (
        <p className="text-xs text-text-muted">La compra queda aparte y no descuenta del saldo hasta que registres el pago real.</p>
      )}
      {mode === 'loan_given' && (
        <p className="text-xs text-text-muted">El préstamo descuenta del saldo ahora y queda pendiente hasta registrar devoluciones.</p>
      )}

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

      {showsTrackingFields && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {mode === 'loan_given' ? 'Persona' : 'Comercio / tarjeta (opcional)'}
            </label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder={mode === 'loan_given' ? 'Ej: Juan Pérez' : 'Ej: Visa / supermercado'}
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Vencimiento (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Monto</label>
        <input
          type="number"
          inputMode={showDecimals ? 'decimal' : 'numeric'}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={showDecimals ? '0,00' : '0'}
          min={showDecimals ? '0.01' : '1'}
          step={showDecimals ? '0.01' : '1'}
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-text-subtle">
          {showDecimals ? 'Acepta montos con decimales.' : 'Modo peso chileno: ingresa montos sin decimales.'}
        </p>
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
