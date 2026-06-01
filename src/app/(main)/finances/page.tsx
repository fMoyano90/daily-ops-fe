'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { Plus, ChevronLeft, ChevronRight, X, Wallet } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/Skeleton'
import { Modal } from '@/components/shared/Modal'
import { DailySummaryCard } from '@/components/finances/DailySummaryCard'
import { FinanceEntryCard } from '@/components/finances/FinanceEntryCard'
import { FinanceEntryForm } from '@/components/finances/FinanceEntryForm'
import { api } from '@/lib/api'
import { FinanceEntry, FinanceEntryCreate, FinanceSummary } from '@/lib/types'
import { getTodayStr, toLocalDateStr } from '@/lib/utils'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

const FINANCE_DECIMALS_KEY = 'dailyops-finance-show-decimals'
const FINANCE_DECIMALS_EVENT = 'dailyops-finance-decimals-change'

function getFinanceDecimalPreference() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(FINANCE_DECIMALS_KEY) === 'true'
}

function subscribeFinanceDecimalPreference(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('storage', callback)
  window.addEventListener(FINANCE_DECIMALS_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(FINANCE_DECIMALS_EVENT, callback)
  }
}

function setFinanceDecimalPreference(value: boolean) {
  window.localStorage.setItem(FINANCE_DECIMALS_KEY, value ? 'true' : 'false')
  window.dispatchEvent(new Event(FINANCE_DECIMALS_EVENT))
}

function toDateStr(d: Date) {
  return toLocalDateStr(d)
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = getTodayStr()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = toDateStr(yesterdayDate)
  if (dateStr === today) return 'Hoy'
  if (dateStr === yesterday) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function FinancesPage() {
  const showDecimals = useSyncExternalStore(subscribeFinanceDecimalPreference, getFinanceDecimalPreference, () => false)
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FinanceEntry | null>(null)

  const load = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const [data, sum] = await Promise.all([
        api.finances.list({ date_from: date, date_to: date }),
        api.finances.summary(date),
      ])
      setEntries(data)
      setSummary(sum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load(selectedDate)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [selectedDate, load])

  function shiftDate(days: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(toDateStr(d))
  }

  async function handleCreate(data: FinanceEntryCreate) {
    await api.finances.create(data)
    setShowForm(false)
    await load(selectedDate)
  }

  async function handleEdit(data: FinanceEntryCreate) {
    if (!editing) return
    await api.finances.update(editing.id, data)
    setEditing(null)
    await load(selectedDate)
  }

  async function handleDelete(id: string) {
    await api.finances.delete(id)
    await load(selectedDate)
  }

  const incomes = entries.filter((e) => e.type === 'income')
  const expenses = entries.filter((e) => e.type === 'expense')

  return (
    <div className="flex flex-col h-full">
      <Header title="Finanzas" subtitle="Control de ingresos y gastos" />

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-lg mx-auto pt-4">

          {/* Date nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-text capitalize">{formatDateLabel(selectedDate)}</p>
              <p className="text-xs text-text-muted">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            <button
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= toDateStr(new Date())}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-bg-elevated px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">Mostrar decimales</p>
              <p className="text-xs text-text-muted">{showDecimals ? 'Montos monedas con decimales' : 'Montos monedas sin decimales'}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center" aria-label="Mostrar decimales en finanzas">
              <input
                type="checkbox"
                checked={showDecimals}
                onChange={(event) => setFinanceDecimalPreference(event.target.checked)}
                className="sr-only peer"
              />
              <span className="h-6 w-11 rounded-full bg-bg-muted transition-colors peer-checked:bg-accent" />
              <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Summary */}
          <DailySummaryCard summary={summary} showDecimals={showDecimals} />

          {/* Add button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors mb-5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Agregar movimiento
          </button>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-danger-soft text-[var(--danger)] text-sm flex items-start gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-7 h-7" />}
              title="Sin movimientos"
              description="Registrá tus ingresos y gastos del día."
              action={
                <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
                  Agregar movimiento
                </button>
              }
            />
          ) : (
            <div className="space-y-5">
              {incomes.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Ingresos</h3>
                  <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-2">
                    {incomes.map((e) => (
                      <motion.li key={e.id} variants={itemVariants}>
                        <FinanceEntryCard entry={e} showDecimals={showDecimals} onEdit={setEditing} onDelete={handleDelete} />
                      </motion.li>
                    ))}
                  </motion.ul>
                </section>
              )}

              {expenses.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Gastos</h3>
                  <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-2">
                    {expenses.map((e) => (
                      <motion.li key={e.id} variants={itemVariants}>
                        <FinanceEntryCard entry={e} showDecimals={showDecimals} onEdit={setEditing} onDelete={handleDelete} />
                      </motion.li>
                    ))}
                  </motion.ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo movimiento">
        <FinanceEntryForm
          defaultDate={selectedDate}
          showDecimals={showDecimals}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar movimiento">
        {editing && (
          <FinanceEntryForm
            initial={editing}
            defaultDate={selectedDate}
            showDecimals={showDecimals}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}
