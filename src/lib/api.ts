import { DailyTask, DailySubtask, DailyPlan, HistoryDay, Project, Task, TimerSession, Subtask, RecurringTask, RecurringInstance, JiraConnection, JiraSyncResult, JiraTestResult, TaskComment, User } from '@/lib/types'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const CACHE_PREFIX = 'api-cache:'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

interface CachedEntry<T> {
  data: T
  timestamp: number
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const entry = (await idbGet(CACHE_PREFIX + key)) as CachedEntry<T> | undefined
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      idbDel(CACHE_PREFIX + key).catch(() => {})
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await idbSet(CACHE_PREFIX + key, { data, timestamp: Date.now() } satisfies CachedEntry<T>)
  } catch {
    // ignore
  }
}

function getAccessToken(): string | null {
  try {
    return localStorage.getItem('dailyops-access')
  } catch {
    return null
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('dailyops-refresh')
  } catch {
    return null
  }
}

function storeTokens(access: string | null, refresh: string | null) {
  try {
    if (access) localStorage.setItem('dailyops-access', access)
    else localStorage.removeItem('dailyops-access')
    if (refresh) localStorage.setItem('dailyops-refresh', refresh)
    else localStorage.removeItem('dailyops-refresh')
  } catch {
    // ignore
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  try {
    const res = await fetch(`${API_BASE}/auth/refresh?token=${refresh}`, { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json()
    storeTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

async function fetchApi<T>(path: string, options?: RequestInit, retryCount = 0): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const method = (options?.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  const cacheKey = isGet ? path : null

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
    })
  } catch (err) {
    // Red caída: si era GET y tenemos copia, devolvemos cache.
    if (cacheKey) {
      const cached = await readCache<T>(cacheKey)
      if (cached !== null) return cached
    }
    throw err
  }

  if (res.status === 401 && retryCount === 0) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetchApi<T>(path, options, retryCount + 1)
    }
    // Refresh failed — logout
    storeTokens(null, null)
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
    throw new Error('Authentication required')
  }

  if (!res.ok) {
    // Si la API responde 5xx y tenemos cache, mejor servirla que romper la UI.
    if (cacheKey && res.status >= 500) {
      const cached = await readCache<T>(cacheKey)
      if (cached !== null) return cached
    }
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  const data = (await res.json()) as T
  if (cacheKey) writeCache(cacheKey, data)
  return data
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(error.detail || 'Login failed')
      }
      const data = await res.json()
      storeTokens(data.access_token, data.refresh_token)
      return data
    },
    me: () => fetchApi<User>('/auth/me'),
    logout: () => {
      storeTokens(null, null)
    },
  },

  projects: {
    list: () => fetchApi<Project[]>('/projects'),
    create: (data: { name: string; type: string; color: string }) =>
      fetchApi<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Project>(`/projects/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/projects/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<Task[]>(`/tasks${qs}`)
    },
    backlog: () => fetchApi<Task[]>('/tasks/backlog'),
    create: (data: Record<string, unknown>) =>
      fetchApi<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Task>(`/tasks/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  taskSubtasks: {
    list: (taskId: string) => fetchApi<Subtask[]>(`/tasks/${taskId}/subtasks`),
    create: (taskId: string, data: { title: string; priority?: string }) =>
      fetchApi<Subtask>(`/tasks/${taskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (taskId: string, subtaskId: string, data: Record<string, unknown>) =>
      fetchApi<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (taskId: string, subtaskId: string) =>
      fetchApi<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
  },

  dailyPlans: {
    getToday: () => fetchApi<DailyPlan>('/daily-plans/today'),
    getByDate: (date: string) => fetchApi<DailyPlan>(`/daily-plans/${date}`),
    create: (data: { date: string; notes?: string }) =>
      fetchApi<DailyPlan>('/daily-plans', { method: 'POST', body: JSON.stringify(data) }),
    selectTasks: (taskIds: string[]) =>
      fetchApi<DailyPlan>('/daily-plans/today/tasks', {
        method: 'POST',
        body: JSON.stringify(taskIds),
      }),
    addTask: (planId: string, data: { task_id: string; priority?: string }) =>
      fetchApi<DailyTask>(`/daily-plans/${planId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSuggestions: () => fetchApi<Record<string, Task[]>>('/daily-plans/today/suggestions'),
    close: (planId: string) =>
      fetchApi<Record<string, unknown>>(`/daily-plans/${planId}/close`, { method: 'POST' }),
    reopen: (planId: string) =>
      fetchApi<Record<string, unknown>>(`/daily-plans/${planId}/reopen`, { method: 'POST' }),
    reorder: (planId: string, taskIds: string[]) =>
      fetchApi<{ updated_count: number }>(`/daily-plans/${planId}/tasks/order`, {
        method: 'PUT',
        body: JSON.stringify({ task_ids: taskIds }),
      }),
  },

  dailyTasks: {
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<DailyTask>(`/daily-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    complete: (id: string) =>
      fetchApi<DailyTask>(`/daily-tasks/${id}/complete`, { method: 'POST' }),
    remove: (id: string) => fetchApi<void>(`/daily-tasks/${id}`, { method: 'DELETE' }),
  },

  subtasks: {
    list: (dailyTaskId: string) => fetchApi<DailySubtask[]>(`/daily-tasks/${dailyTaskId}/subtasks`),
    create: (dailyTaskId: string, data: { title: string; priority?: string }) =>
      fetchApi<DailySubtask>(`/daily-tasks/${dailyTaskId}/subtasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (dailyTaskId: string, subtaskId: string, data: Record<string, unknown>) =>
      fetchApi<DailySubtask>(`/daily-tasks/${dailyTaskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (dailyTaskId: string, subtaskId: string) =>
      fetchApi<void>(`/daily-tasks/${dailyTaskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),
  },

  timers: {
    start: (taskId: string) =>
      fetchApi<{ session_id: string; started_at: string }>(`/daily-tasks/${taskId}/timer/start`, { method: 'POST' }),
    pause: (taskId: string) =>
      fetchApi<TimerSession>(`/daily-tasks/${taskId}/timer/pause`, { method: 'POST' }),
    resume: (taskId: string) =>
      fetchApi<{ session_id: string; started_at: string }>(`/daily-tasks/${taskId}/timer/resume`, { method: 'POST' }),
    stop: (taskId: string) =>
      fetchApi<{ session_id: string; stopped_at: string; duration_seconds: number; task_total_seconds: number }>(`/daily-tasks/${taskId}/timer/stop`, { method: 'POST' }),
    reset: (taskId: string) =>
      fetchApi<{ task_total_seconds: number; status: string }>(`/daily-tasks/${taskId}/timer/reset`, { method: 'POST' }),
    sessions: (taskId: string) => fetchApi<TimerSession[]>(`/daily-tasks/${taskId}/timer/sessions`),
  },

  history: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<HistoryDay[]>(`/history${qs}`)
    },
    getByDate: (date: string) => fetchApi<HistoryDay>(`/history/${date}`),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<Record<string, unknown>>(`/history/summary/week${qs}`)
    },
  },

  jira: {
    list: () => fetchApi<JiraConnection[]>('/jira-connections'),
    create: (data: {
      name: string
      base_url: string
      email: string
      api_token: string
      jql?: string
      project_color?: string
    }) =>
      fetchApi<JiraConnection>('/jira-connections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<JiraConnection>(`/jira-connections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string, purgeTasks = false) =>
      fetchApi<void>(`/jira-connections/${id}?purge_tasks=${purgeTasks}`, {
        method: 'DELETE',
      }),
    test: (id: string) =>
      fetchApi<JiraTestResult>(`/jira-connections/${id}/test`, { method: 'POST' }),
    sync: (id: string) =>
      fetchApi<JiraSyncResult>(`/jira-connections/${id}/sync`, { method: 'POST' }),
    syncAll: () =>
      fetchApi<JiraSyncResult[]>('/jira-connections/sync-all', { method: 'POST' }),
  },

  taskComments: {
    listForTask: (taskId: string) => fetchApi<TaskComment[]>(`/tasks/${taskId}/comments`),
    createForTask: (taskId: string, content: string) =>
      fetchApi<TaskComment>(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    listForRecurring: (recurringTaskId: string) =>
      fetchApi<TaskComment[]>(`/recurring-tasks/${recurringTaskId}/comments`),
    createForRecurring: (recurringTaskId: string, content: string) =>
      fetchApi<TaskComment>(`/recurring-tasks/${recurringTaskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    update: (commentId: string, content: string) =>
      fetchApi<TaskComment>(`/task-comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    delete: (commentId: string) =>
      fetchApi<void>(`/task-comments/${commentId}`, { method: 'DELETE' }),
  },

  recurringTasks: {
    list: (activeOnly = true) => fetchApi<RecurringTask[]>(`/recurring-tasks?active_only=${activeOnly}`),
    create: (data: Record<string, unknown>) =>
      fetchApi<RecurringTask>('/recurring-tasks', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<RecurringTask>(`/recurring-tasks/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<RecurringTask>(`/recurring-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggle: (id: string, isActive: boolean) =>
      fetchApi<RecurringTask>(`/recurring-tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) }),
    delete: (id: string) => fetchApi<void>(`/recurring-tasks/${id}`, { method: 'DELETE' }),
    history: (id: string, limit = 30) => fetchApi<RecurringInstance[]>(`/recurring-tasks/${id}/history?limit=${limit}`),
  },

  push: {
    getPublicKey: () => fetchApi<{ key: string }>('/push/vapid-public-key'),
    subscribe: (data: {
      endpoint: string
      keys: { p256dh: string; auth: string }
      user_agent?: string
    }) =>
      fetchApi<{ id: string; endpoint: string; created_at: string }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    unsubscribe: (endpoint: string) =>
      fetchApi<void>(`/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
      }),
    test: (data: { title?: string; body?: string; url?: string } = {}) =>
      fetchApi<{ sent: number }>('/push/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}
