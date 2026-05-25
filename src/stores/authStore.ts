import { create } from 'zustand'
import { User } from '@/lib/types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

function getStoredToken(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function storeToken(key: string, value: string | null) {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: getStoredToken('dailyops-access'),
  refreshToken: getStoredToken('dailyops-refresh'),
  isAuthenticated: !!getStoredToken('dailyops-access'),
  isLoading: true,

  setTokens: (access, refresh) => {
    storeToken('dailyops-access', access)
    storeToken('dailyops-refresh', refresh)
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true })
  },

  setUser: (user) => set({ user }),

  logout: () => {
    storeToken('dailyops-access', null)
    storeToken('dailyops-refresh', null)
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    const access = getStoredToken('dailyops-access')
    if (!access) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${access}` },
      })

      if (!res.ok) {
        // Try refresh
        const refresh = getStoredToken('dailyops-refresh')
        if (refresh) {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh?token=${refresh}`, {
            method: 'POST',
          })
          if (refreshRes.ok) {
            const data = await refreshRes.json()
            storeToken('dailyops-access', data.access_token)
            storeToken('dailyops-refresh', data.refresh_token)

            const meRes = await fetch(`${API_BASE}/auth/me`, {
              headers: { 'Authorization': `Bearer ${data.access_token}` },
            })
            if (meRes.ok) {
              const user = await meRes.json()
              set({ user, accessToken: data.access_token, refreshToken: data.refresh_token, isAuthenticated: true, isLoading: false })
              return
            }
          }
        }
        // All failed
        storeToken('dailyops-access', null)
        storeToken('dailyops-refresh', null)
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
        return
      }

      const user = await res.json()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      storeToken('dailyops-access', null)
      storeToken('dailyops-refresh', null)
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
