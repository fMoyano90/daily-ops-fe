'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = toDateStr(new Date())
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Hoy'
  if (dateStr === yesterday) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function FinancesPage() {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
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
    void load(selectedDate)
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

          {/* Summary */}
          <DailySummaryCard summary={summary} />

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
                        <FinanceEntryCard entry={e} onEdit={setEditing} onDelete={handleDelete} />
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
                        <FinanceEntryCard entry={e} onEdit={setEditing} onDelete={handleDelete} />
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
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar movimiento">
        {editing && (
          <FinanceEntryForm
            initial={editing}
            defaultDate={selectedDate}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}
