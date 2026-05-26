'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out as Uint8Array<ArrayBuffer>
}

type Status = 'loading' | 'unsupported' | 'denied' | 'idle' | 'subscribed'

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscription(sub)
      setStatus(sub ? 'subscribed' : 'idle')
    } catch (err) {
      console.error(err)
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const subscribe = async () => {
    setBusy(true)
    setError(null)
    try {
      const { key } = await api.push.getPublicKey()
      if (!key) throw new Error('Servidor no entregó la clave VAPID')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      const json = sub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }
      await api.push.subscribe({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        user_agent: navigator.userAgent,
      })
      setSubscription(sub)
      setStatus('subscribed')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'No se pudo activar'
      setError(msg)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const unsubscribe = async () => {
    if (!subscription) return
    setBusy(true)
    setError(null)
    try {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      try {
        await api.push.unsubscribe(endpoint)
      } catch {
        // backend cleanup best-effort
      }
      setSubscription(null)
      setStatus('idle')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo desactivar')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    try {
      await api.push.test({ title: 'DailyOps', body: '¡Notificaciones activadas!', url: '/today' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test falló')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') {
    return <div className="text-sm text-text-subtle">Cargando…</div>
  }

  if (status === 'unsupported') {
    return (
      <div className="flex items-start gap-2 text-sm text-text-muted">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Tu navegador no soporta notificaciones push. En iOS instala la app desde Compartir → Añadir a inicio.</span>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex items-start gap-2 text-sm text-text-muted">
        <BellOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Bloqueaste las notificaciones para este sitio. Habilítalas desde la configuración del navegador.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === 'subscribed' ? (
          <>
            <button
              onClick={unsubscribe}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border text-text hover:bg-bg-muted disabled:opacity-60 touch-target"
            >
              <BellOff className="w-4 h-4" />
              Desactivar recordatorios
            </button>
            <button
              onClick={sendTest}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-accent-soft disabled:opacity-60 touch-target"
            >
              Enviar prueba
            </button>
          </>
        ) : (
          <button
            onClick={subscribe}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent text-accent-fg hover:bg-accent-hover disabled:opacity-60 touch-target"
          >
            <Bell className="w-4 h-4" />
            Activar recordatorios
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
