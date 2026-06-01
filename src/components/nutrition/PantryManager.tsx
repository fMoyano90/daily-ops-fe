'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, ShoppingBasket, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { PantryItem, PantryItemSuggestion } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PantryManager() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [suggestions, setSuggestions] = useState<PantryItemSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.nutrition.getPantry()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const toggle = async (item: PantryItem) => {
    const next = items.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
    setItems(next)
    try {
      const updated = await api.nutrition.updatePantryItem(item.id, { is_available: !item.is_available })
      setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
    } catch {
      setItems(items)
    }
  }

  const remove = async (item: PantryItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    try {
      await api.nutrition.deletePantryItem(item.id)
    } catch {
      setItems(items)
    }
  }

  const startEdit = (item: PantryItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  const commitEdit = async (item: PantryItem) => {
    const name = editingName.trim()
    setEditingId(null)
    if (!name || name === item.name) return
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name } : i))
    try {
      const updated = await api.nutrition.updatePantryItem(item.id, { name })
      setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: item.name } : i))
    }
  }

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true)
    setSuggestions([])
    setAddedIds(new Set())
    try {
      const data = await api.nutrition.getPantrySuggestions()
      setSuggestions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const addSuggestion = async (suggestion: PantryItemSuggestion) => {
    try {
      const created = await api.nutrition.addPantryItem({ name: suggestion.name })
      setItems((prev) => [...prev, created])
      setAddedIds((prev) => new Set(prev).add(suggestion.name))
    } catch (err) {
      console.error(err)
    }
  }

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const created = await api.nutrition.addPantryItem({ name })
      setItems((prev) => [...prev, created])
      setNewName('')
      inputRef.current?.focus()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const available = items.filter((i) => i.is_available)
  const unavailable = items.filter((i) => !i.is_available)

  return (
    <section aria-labelledby="pantry-title" className="bg-bg-elevated border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
            <ShoppingBasket className="w-4 h-4 text-accent" aria-hidden="true" />
          </span>
          <div>
            <h2 id="pantry-title" className="text-sm font-semibold text-text">Despensa</h2>
            {loading ? (
              <p className="text-xs text-text-muted mt-0.5">Cargando...</p>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">
                {items.length === 0
                  ? 'Sin ingredientes guardados'
                  : <><span className="text-[var(--success)] font-medium">{available.length} disponible{available.length !== 1 ? 's' : ''}</span>{unavailable.length > 0 ? ` · ${unavailable.length} agotado${unavailable.length !== 1 ? 's' : ''}` : ''}</>
                }
              </p>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            Marca cada ingrediente como <span className="text-[var(--success)] font-medium">disponible</span> o <span className="text-text-muted font-medium line-through decoration-[var(--danger)]">agotado</span>. El planificador IA usará solo los disponibles.
          </p>

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    aria-label={item.is_available ? 'Marcar como agotado' : 'Marcar como disponible'}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',
                      item.is_available
                        ? 'bg-[var(--success)] border-[var(--success)]'
                        : 'bg-transparent border-border hover:border-[var(--success)]'
                    )}
                  />
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(item) }
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      maxLength={200}
                      className="flex-1 text-sm bg-transparent border-b border-accent text-text focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      title="Clic para editar nombre"
                      className={cn('flex-1 text-sm text-left truncate hover:underline decoration-dotted underline-offset-2', item.is_available ? 'text-text' : 'text-text-muted line-through')}
                    >
                      {item.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Eliminar ${item.name}`}
                    className="text-text-subtle hover:text-[var(--danger)] transition-colors p-1 rounded-lg hover:bg-danger-soft/40 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {items.length === 0 && (
            <p className="text-sm text-text-subtle text-center py-2">
              Añade tus ingredientes habituales para que el planificador los use automáticamente.
            </p>
          )}

          <form onSubmit={add} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: arroz, pollo, brócoli..."
              maxLength={200}
              className="flex-1 px-3 py-2 border border-border rounded-xl text-sm bg-bg text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-fg text-sm font-semibold disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Añadir
            </button>
          </form>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Qué comprar</p>
                <p className="text-xs text-text-muted mt-0.5">Sugerencias IA basadas en tu perfil, objetivos y despensa actual.</p>
              </div>
              <button
                type="button"
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-accent/40 bg-accent-soft/20 text-accent text-xs font-semibold hover:bg-accent-soft/40 disabled:opacity-60 transition-colors flex-shrink-0"
              >
                {loadingSuggestions
                  ? <><span className="w-3 h-3 border-2 border-accent/40 border-t-accent rounded-full animate-spin" /> Analizando...</>
                  : <><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Sugerir</>
                }
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="space-y-2">
                {suggestions.map((s) => {
                  const alreadyAdded = addedIds.has(s.name) || items.some((i) => i.name.toLowerCase() === s.name.toLowerCase())
                  return (
                    <li key={s.name} className="flex items-start gap-3 rounded-xl border border-border bg-bg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-text">{s.name}</span>
                          <span className="text-xs text-text-subtle rounded-full bg-bg-muted px-2 py-0.5">{s.category}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{s.reason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSuggestion(s)}
                        disabled={alreadyAdded}
                        aria-label={alreadyAdded ? 'Ya en despensa' : `Añadir ${s.name}`}
                        className={cn(
                          'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          alreadyAdded
                            ? 'bg-success-soft text-[var(--success)] cursor-default'
                            : 'bg-accent text-accent-fg hover:bg-[var(--accent-hover)]'
                        )}
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export function usePantryCount() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    api.nutrition.getPantry()
      .then((items) => setCount(items.filter((i) => i.is_available).length))
      .catch(() => setCount(0))
  }, [])
  return count
}
