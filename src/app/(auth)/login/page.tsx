'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'
import { Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setTokens, setUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/today')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await api.auth.login(email, password)
      setTokens(data.access_token, data.refresh_token)

      const user = await api.auth.me()
      setUser(user)

      router.push('/today')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">DailyOps</h1>
          <p className="text-text-muted mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-elevated border border-border rounded-2xl p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-text-subtle">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg-muted text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-text-subtle">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg-muted text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-2.5 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-subtle mt-6">
          DailyOps — Organiza tu día
        </p>
      </div>
    </div>
  )
}
