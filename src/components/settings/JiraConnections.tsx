'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Modal } from '@/components/shared/Modal'
import { Skeleton } from '@/components/shared/Skeleton'
import { api } from '@/lib/api'
import { JiraConnection, JiraSyncResult } from '@/lib/types'
import { Plus, RefreshCw, CheckCircle2, XCircle, Pencil, Trash2, Loader2, PlugZap } from 'lucide-react'

const DEFAULT_JQL =
  'assignee = currentUser() AND sprint in openSprints() AND statusCategory != Done'

interface FormState {
  id?: string
  name: string
  base_url: string
  email: string
  api_token: string
  jql: string
}

const emptyForm: FormState = {
  name: '',
  base_url: '',
  email: '',
  api_token: '',
  jql: DEFAULT_JQL,
}

function fmtDate(iso?: string | null) {
  if (!iso) return 'Nunca'
  const d = new Date(iso)
  return d.toLocaleString()
}

function statusBadge(conn: JiraConnection) {
  const s = conn.last_sync_status
  if (!s) return <span className="text-xs text-text-subtle">Sin sincronizar</span>
  if (s === 'ok') return <span className="text-xs px-2 py-0.5 bg-success-soft text-[var(--success)] rounded-full">OK</span>
  if (s === 'partial') return <span className="text-xs px-2 py-0.5 bg-warning-soft text-[var(--warning)] rounded-full">Parcial</span>
  return <span className="text-xs px-2 py-0.5 bg-danger-soft text-[var(--danger)] rounded-full">Error</span>
}

export function JiraConnections() {
  const [connections, setConnections] = useState<JiraConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'test' | 'sync' | 'delete' | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.jira.list()
      setConnections(data)
    } catch (err) {
      console.error('Failed to load Jira connections', err)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(conn: JiraConnection) {
    setForm({
      id: conn.id,
      name: conn.name,
      base_url: conn.base_url,
      email: conn.email,
      api_token: '',
      jql: conn.jql,
    })
    setModalOpen(true)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)
    try {
      if (form.id) {
        const patch: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          jql: form.jql,
        }
        if (form.api_token) patch.api_token = form.api_token
        await api.jira.update(form.id, patch)
      } else {
        await api.jira.create({
          name: form.name,
          base_url: form.base_url,
          email: form.email,
          api_token: form.api_token,
          jql: form.jql,
        })
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error guardando conexión' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTest(conn: JiraConnection) {
    setBusyId(conn.id)
    setBusyAction('test')
    setFeedback(null)
    try {
      const res = await api.jira.test(conn.id)
      if (res.ok) {
        setFeedback({ kind: 'ok', text: `Conectado como ${res.display_name || res.email}` })
      } else {
        setFeedback({ kind: 'err', text: res.error || 'Test falló' })
      }
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error de red' })
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  function summarizeResult(r: JiraSyncResult) {
    const base = `${r.connection_name}: ${r.created} creadas, ${r.updated} actualizadas`
    return r.errors.length ? `${base} (${r.errors.length} errores)` : base
  }

  async function handleSync(conn: JiraConnection) {
    setBusyId(conn.id)
    setBusyAction('sync')
    setFeedback(null)
    try {
      const result = await api.jira.sync(conn.id)
      const kind: 'ok' | 'err' = result.status === 'error' ? 'err' : 'ok'
      setFeedback({ kind, text: summarizeResult(result) })
      await load()
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error de red' })
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    setFeedback(null)
    try {
      const results = await api.jira.syncAll()
      if (!results.length) {
        setFeedback({ kind: 'ok', text: 'No hay conexiones habilitadas' })
      } else {
        const text = results.map(summarizeResult).join(' · ')
        const anyError = results.some((r) => r.status === 'error')
        setFeedback({ kind: anyError ? 'err' : 'ok', text })
      }
      await load()
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error de red' })
    } finally {
      setSyncingAll(false)
    }
  }

  async function handleDelete(conn: JiraConnection) {
    const purge = window.confirm(
      `Eliminar conexión "${conn.name}"?\n\nAceptar = también borrar todas las tareas de Jira asociadas.\nCancelar = solo borrar la conexión, las tareas quedan en el backlog.`,
    )
    const reallyDelete = window.confirm(
      purge
        ? `Confirmar: eliminar conexión Y purgar tareas de "${conn.name}"`
        : `Confirmar: eliminar conexión "${conn.name}" conservando las tareas`,
    )
    if (!reallyDelete) return

    setBusyId(conn.id)
    setBusyAction('delete')
    try {
      await api.jira.delete(conn.id, purge)
      await load()
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error al eliminar' })
    } finally {
      setBusyId(null)
      setBusyAction(null)
    }
  }

  async function toggleEnabled(conn: JiraConnection) {
    try {
      await api.jira.update(conn.id, { enabled: !conn.enabled })
      await load()
    } catch (err) {
      setFeedback({ kind: 'err', text: err instanceof Error ? err.message : 'Error' })
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PlugZap className="w-5 h-5 text-text-subtle" />
          <h3 className="text-lg font-semibold text-text">Conexiones Jira</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || connections.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-border text-sm font-medium rounded-lg text-text-muted hover:bg-bg-muted transition-colors disabled:opacity-50"
          >
            {syncingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync all
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva conexión
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-start gap-2 ${
            feedback.kind === 'ok'
              ? 'bg-success-soft text-[var(--success)]'
              : 'bg-danger-soft text-[var(--danger)]'
          }`}
        >
          {feedback.kind === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-8 bg-bg-elevated border border-border rounded-xl">
          <p className="text-text-subtle text-sm">No hay conexiones Jira configuradas</p>
          <p className="text-text-subtle text-xs mt-1">
            Crea una para sincronizar tus issues asignadas al backlog
          </p>
        </div>
      ) : (
        <motion.div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="p-4 bg-bg-elevated border border-border rounded-xl hover:border-border-strong transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-text">{conn.name}</h4>
                    {statusBadge(conn)}
                    {!conn.enabled && (
                      <span className="text-xs px-2 py-0.5 bg-bg-muted text-text-subtle rounded-full">
                        Pausada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">
                    {conn.email} · <span className="font-mono">{conn.base_url}</span>
                  </p>
                  <p className="text-xs text-text-subtle mt-1 truncate" title={conn.jql}>
                    JQL: {conn.jql}
                  </p>
                  <p className="text-xs text-text-subtle mt-1">
                    Último sync: {fmtDate(conn.last_sync_at)}
                    {conn.last_sync_error && (
                      <span className="text-[var(--danger)] ml-2" title={conn.last_sync_error}>
                        · {conn.last_sync_error.slice(0, 80)}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTest(conn)}
                      disabled={busyId === conn.id}
                      className="p-2 text-text-subtle hover:text-text-muted hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-50"
                      title="Test"
                    >
                      {busyId === conn.id && busyAction === 'test' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlugZap className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSync(conn)}
                      disabled={busyId === conn.id}
                      className="p-2 text-accent hover:bg-accent-soft rounded-lg transition-colors disabled:opacity-50"
                      title="Sync now"
                    >
                      {busyId === conn.id && busyAction === 'sync' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(conn)}
                      className="p-2 text-text-subtle hover:text-text-muted hover:bg-bg-muted rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(conn)}
                      disabled={busyId === conn.id}
                      className="p-2 text-[var(--danger)] hover:bg-danger-soft rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {busyId === conn.id && busyAction === 'delete' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => toggleEnabled(conn)}
                    className="text-xs text-text-subtle hover:text-text-muted underline-offset-2 hover:underline"
                  >
                    {conn.enabled ? 'Pausar sync auto' : 'Reanudar sync auto'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-lg">
        <form onSubmit={submitForm} className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">
            {form.id ? 'Editar conexión Jira' : 'Nueva conexión Jira'}
          </h3>

          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Wingenroth"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Base URL</label>
            <input
              type="url"
              required
              disabled={!!form.id}
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="https://acme.atlassian.net"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
            {form.id && (
              <p className="text-xs text-text-subtle mt-1">
                La URL no se puede cambiar; elimina y crea una nueva conexión si necesitas migrar.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu.email@empresa.com"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">
              API Token {form.id && <span className="text-text-subtle">(dejar vacío para no cambiar)</span>}
            </label>
            <input
              type="password"
              required={!form.id}
              value={form.api_token}
              onChange={(e) => setForm({ ...form, api_token: e.target.value })}
              placeholder="ATATT3xF..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-text-subtle mt-1">
              Generá uno en id.atlassian.com → Security → API tokens.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">JQL</label>
            <textarea
              required
              rows={3}
              value={form.jql}
              onChange={(e) => setForm({ ...form, jql: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {form.id ? 'Guardar' : 'Crear y conectar'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
