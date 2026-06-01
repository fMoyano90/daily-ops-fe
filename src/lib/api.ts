import { DailyTask, DailySubtask, DailyPlan, HistoryDay, Project, Task, TimerSession, Subtask, RecurringTask, RecurringInstance, JiraConnection, JiraSyncResult, JiraTestResult, TaskComment, User, Goal, GoalStep, GoalComment, GoalSummary, EmotionEntry, EmotionSummary, DailyReflection, DailyReflectionInput, DailyReflectionSummary, SleepLog, SleepLogInput, SleepLogSummary, HealthProfile, HealthProfileInput, MealEntry, MealEntryInput, MealEntryUpdate, ExerciseEntry, ExerciseEntryInput, ExerciseEntryUpdate, NutritionDay, NutritionDaySummary, WeightEntry, PantryItem, PantryItemSuggestion, HealthCondition, HealthConditionInput, HealthConditionUpdate, HealthGuideline, HealthGuidelineInput, HealthGuidelineUpdate, HealthReminder, HealthReminderInput, HealthReminderUpdate, GuidelineSuggestion, SicknessEpisode, SicknessEpisodeInput, SicknessEpisodeUpdate, SicknessEpisodeSummary, Habit, HabitCreate, HabitUpdate, HabitEvent, HabitEventCreate, HabitEventUpdate, HabitSummary, FinanceEntry, FinanceEntryCreate, FinanceEntryUpdate, FinanceLoan, FinanceSummary, ExerciseProfile, ExerciseProfileInput, WorkoutDay, WorkoutDayUpdate, WorkoutExercise, WorkoutExerciseCreate, WorkoutExerciseUpdate, WorkoutWeekSummary, DailyContextInput } from '@/lib/types'
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

function formatApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback
  const detail = (error as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item)
        const loc = Array.isArray((item as { loc?: unknown }).loc)
          ? (item as { loc: unknown[] }).loc.join('.')
          : ''
        const msg = (item as { msg?: unknown }).msg
        return loc && msg ? `${loc}: ${String(msg)}` : msg ? String(msg) : JSON.stringify(item)
      })
      .join('; ')
  }
  if (detail && typeof detail === 'object') {
    const message = (detail as { message?: unknown; msg?: unknown }).message ?? (detail as { msg?: unknown }).msg
    if (typeof message === 'string') return message
    return JSON.stringify(detail)
  }
  return fallback
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
    throw new Error(formatApiError(error, 'Request failed'))
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
    close: (planId: string, reflection?: DailyReflectionInput) =>
      fetchApi<Record<string, unknown>>(`/daily-plans/${planId}/close`, {
        method: 'POST',
        body: JSON.stringify(reflection ? { reflection } : {}),
      }),
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
    reopen: (id: string) =>
      fetchApi<DailyTask>(`/daily-tasks/${id}/reopen`, { method: 'POST' }),
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
    list: () => fetchApi<{ subscriptions: Array<{ id: string; endpoint: string; user_agent: string | null; created_at: string; last_seen_at: string }>; count: number }>('/push/subscriptions'),
    keepOnlyCurrent: (endpoint: string) =>
      fetchApi<void>(`/push/keep-only-current?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'POST',
      }),
  },

  goals: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<Goal[]>(`/goals${qs}`)
    },
    create: (data: Record<string, unknown>) =>
      fetchApi<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<Goal>(`/goals/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/goals/${id}`, { method: 'DELETE' }),
    complete: (id: string) => fetchApi<Goal>(`/goals/${id}/complete`, { method: 'POST' }),
    reopen: (id: string) => fetchApi<Goal>(`/goals/${id}/reopen`, { method: 'POST' }),
    summary: () => fetchApi<GoalSummary>('/goals/summary'),
    steps: {
      list: (goalId: string) => fetchApi<GoalStep[]>(`/goals/${goalId}/steps`),
      create: (goalId: string, data: Record<string, unknown>) =>
        fetchApi<GoalStep>(`/goals/${goalId}/steps`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (goalId: string, stepId: string, data: Record<string, unknown>) =>
        fetchApi<GoalStep>(`/goals/${goalId}/steps/${stepId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (goalId: string, stepId: string) =>
        fetchApi<void>(`/goals/${goalId}/steps/${stepId}`, { method: 'DELETE' }),
      complete: (goalId: string, stepId: string) =>
        fetchApi<GoalStep>(`/goals/${goalId}/steps/${stepId}/complete`, { method: 'POST' }),
      reorder: (goalId: string, stepIds: string[]) =>
        fetchApi<{ updated_count: number }>(`/goals/${goalId}/steps/reorder`, {
          method: 'PUT',
          body: JSON.stringify({ step_ids: stepIds }),
        }),
    },
    comments: {
      list: (goalId: string) => fetchApi<GoalComment[]>(`/goals/${goalId}/comments`),
      create: (goalId: string, content: string) =>
        fetchApi<GoalComment>(`/goals/${goalId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        }),
      update: (goalId: string, commentId: string, content: string) =>
        fetchApi<GoalComment>(`/goals/${goalId}/comments/${commentId}`, {
          method: 'PATCH',
          body: JSON.stringify({ content }),
        }),
      delete: (goalId: string, commentId: string) =>
        fetchApi<void>(`/goals/${goalId}/comments/${commentId}`, { method: 'DELETE' }),
    },
  },

  emotions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<EmotionEntry[]>(`/emotions${qs}`)
    },
    today: () => fetchApi<EmotionEntry[]>('/emotions/today'),
    create: (data: Record<string, unknown>) =>
      fetchApi<EmotionEntry>('/emotions', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => fetchApi<EmotionEntry>(`/emotions/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<EmotionEntry>(`/emotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/emotions/${id}`, { method: 'DELETE' }),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<EmotionSummary>(`/emotions/summary/week${qs}`)
    },
  },

  dailyReflections: {
    today: () => fetchApi<DailyReflection | null>('/daily-reflections/today'),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<DailyReflection[]>(`/daily-reflections${qs}`)
    },
    getByDate: (date: string) => fetchApi<DailyReflection>(`/daily-reflections/${date}`),
    update: (id: string, data: DailyReflectionInput) =>
      fetchApi<DailyReflection>(`/daily-reflections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/daily-reflections/${id}`, { method: 'DELETE' }),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<DailyReflectionSummary>(`/daily-reflections/summary/week${qs}`)
    },
    monthlySummary: (month?: string) => {
      const qs = month ? `?month=${month}` : ''
      return fetchApi<DailyReflectionSummary>(`/daily-reflections/summary/month${qs}`)
    },
  },

  sleepLogs: {
    today: () => fetchApi<SleepLog | null>('/sleep-logs/today'),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<SleepLog[]>(`/sleep-logs${qs}`)
    },
    create: (data: SleepLogInput) =>
      fetchApi<SleepLog>('/sleep-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByDate: (date: string) => fetchApi<SleepLog>(`/sleep-logs/${date}`),
    update: (id: string, data: SleepLogInput) =>
      fetchApi<SleepLog>(`/sleep-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchApi<void>(`/sleep-logs/${id}`, { method: 'DELETE' }),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<SleepLogSummary>(`/sleep-logs/summary/week${qs}`)
    },
    monthlySummary: (month?: string) => {
      const qs = month ? `?month=${month}` : ''
      return fetchApi<SleepLogSummary>(`/sleep-logs/summary/month${qs}`)
    },
  },

  nutrition: {
    profile: () => fetchApi<HealthProfile | null>('/nutrition/profile'),
    saveProfile: (data: HealthProfileInput) =>
      fetchApi<HealthProfile>('/nutrition/profile', { method: 'PUT', body: JSON.stringify(data) }),
    today: () => fetchApi<NutritionDay>('/nutrition/today'),
    getByDate: (date: string) => fetchApi<NutritionDay>(`/nutrition/${date}`),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<NutritionDay[]>(`/nutrition${qs}`)
    },
    createMeal: (data: MealEntryInput) =>
      fetchApi<MealEntry>('/nutrition/meals', { method: 'POST', body: JSON.stringify(data) }),
    updateMeal: (id: string, data: MealEntryUpdate) =>
      fetchApi<MealEntry>(`/nutrition/meals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteMeal: (id: string) => fetchApi<void>(`/nutrition/meals/${id}`, { method: 'DELETE' }),
    createExercise: (data: ExerciseEntryInput) =>
      fetchApi<ExerciseEntry>('/nutrition/exercises', { method: 'POST', body: JSON.stringify(data) }),
    updateExercise: (id: string, data: ExerciseEntryUpdate) =>
      fetchApi<ExerciseEntry>(`/nutrition/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteExercise: (id: string) => fetchApi<void>(`/nutrition/exercises/${id}`, { method: 'DELETE' }),
    setWater: (date: string, data: { delta?: number; water_ml?: number }) =>
      fetchApi<NutritionDay>(`/nutrition/${date}/water`, { method: 'POST', body: JSON.stringify(data) }),
    analyze: (date: string) => fetchApi<NutritionDay>(`/nutrition/${date}/analyze`, { method: 'POST' }),
    generateMealPlan: (date: string, data: { context_type: string; context_text: string }) =>
      fetchApi<NutritionDay>(`/nutrition/${date}/meal-plan`, { method: 'POST', body: JSON.stringify(data) }),
    getWeightHistory: (limit = 90) => fetchApi<WeightEntry[]>(`/nutrition/weight-history?limit=${limit}`),
    getPantry: () => fetchApi<PantryItem[]>('/nutrition/pantry'),
    addPantryItem: (data: { name: string; is_available?: boolean }) =>
      fetchApi<PantryItem>('/nutrition/pantry', { method: 'POST', body: JSON.stringify(data) }),
    updatePantryItem: (id: string, data: { name?: string; is_available?: boolean; sort_order?: number }) =>
      fetchApi<PantryItem>(`/nutrition/pantry/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePantryItem: (id: string) => fetchApi<void>(`/nutrition/pantry/${id}`, { method: 'DELETE' }),
    getPantrySuggestions: () => fetchApi<PantryItemSuggestion[]>('/nutrition/pantry/suggestions', { method: 'POST' }),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<NutritionDaySummary>(`/nutrition/summary/week${qs}`)
    },
  },

  health: {
    conditions: {
      list: () => fetchApi<HealthCondition[]>('/health/conditions'),
      get: (id: string) => fetchApi<HealthCondition>(`/health/conditions/${id}`),
      create: (data: HealthConditionInput) =>
        fetchApi<HealthCondition>('/health/conditions', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: HealthConditionUpdate) =>
        fetchApi<HealthCondition>(`/health/conditions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi<void>(`/health/conditions/${id}`, { method: 'DELETE' }),
    },
    guidelines: {
      create: (conditionId: string, data: HealthGuidelineInput) =>
        fetchApi<HealthGuideline>(`/health/conditions/${conditionId}/guidelines`, { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: HealthGuidelineUpdate) =>
        fetchApi<HealthGuideline>(`/health/guidelines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi<void>(`/health/guidelines/${id}`, { method: 'DELETE' }),
    },
    reminders: {
      create: (conditionId: string, data: HealthReminderInput) =>
        fetchApi<HealthReminder>(`/health/conditions/${conditionId}/reminders`, { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: HealthReminderUpdate) =>
        fetchApi<HealthReminder>(`/health/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi<void>(`/health/reminders/${id}`, { method: 'DELETE' }),
    },
    suggest: (data: { name: string; category?: string }) =>
      fetchApi<GuidelineSuggestion>('/health/conditions/suggest', { method: 'POST', body: JSON.stringify(data) }),
    episodes: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return fetchApi<SicknessEpisode[]>(`/health/episodes${qs}`)
      },
      create: (data: SicknessEpisodeInput) =>
        fetchApi<SicknessEpisode>('/health/episodes', { method: 'POST', body: JSON.stringify(data) }),
      get: (id: string) => fetchApi<SicknessEpisode>(`/health/episodes/${id}`),
      update: (id: string, data: SicknessEpisodeUpdate) =>
        fetchApi<SicknessEpisode>(`/health/episodes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi<void>(`/health/episodes/${id}`, { method: 'DELETE' }),
      summary: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return fetchApi<SicknessEpisodeSummary>(`/health/episodes/summary${qs}`)
      },
    },
  },

  habits: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<Habit[]>(`/habits${qs}`)
    },
    get: (id: string) => fetchApi<Habit>(`/habits/${id}`),
    create: (data: HabitCreate) =>
      fetchApi<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: HabitUpdate) =>
      fetchApi<Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/habits/${id}`, { method: 'DELETE' }),
    events: {
      list: (habitId: string, params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return fetchApi<HabitEvent[]>(`/habits/${habitId}/events${qs}`)
      },
      create: (habitId: string, data: HabitEventCreate) =>
        fetchApi<HabitEvent>(`/habits/${habitId}/events`, { method: 'POST', body: JSON.stringify(data) }),
      update: (habitId: string, eventId: string, data: HabitEventUpdate) =>
        fetchApi<HabitEvent>(`/habits/${habitId}/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (habitId: string, eventId: string) =>
        fetchApi<void>(`/habits/${habitId}/events/${eventId}`, { method: 'DELETE' }),
    },
    summary: (habitId: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<HabitSummary>(`/habits/${habitId}/summary${qs}`)
    },
  },
  finances: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<FinanceEntry[]>(`/finances/entries${qs}`)
    },
    create: (data: FinanceEntryCreate) =>
      fetchApi<FinanceEntry>('/finances/entries', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: FinanceEntryUpdate) =>
      fetchApi<FinanceEntry>(`/finances/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi<void>(`/finances/entries/${id}`, { method: 'DELETE' }),
    summary: (date: string) => fetchApi<FinanceSummary>(`/finances/summary?date=${date}`),
    creditPurchases: (status = 'open') =>
      fetchApi<FinanceEntry[]>(`/finances/credit-purchases?status=${status}`),
    loans: (status = 'open') => fetchApi<FinanceLoan[]>(`/finances/loans?status=${status}`),
    repayLoan: (id: string, data: { date: string; amount: number; description?: string | null }) =>
      fetchApi<FinanceLoan>(`/finances/loans/${id}/repay`, { method: 'POST', body: JSON.stringify(data) }),
  },

  exercise: {
    getProfile: () => fetchApi<ExerciseProfile | null>('/exercise/profile'),
    saveProfile: (data: ExerciseProfileInput) =>
      fetchApi<ExerciseProfile>('/exercise/profile', { method: 'PUT', body: JSON.stringify(data) }),
    today: () => fetchApi<WorkoutDay>('/exercise/today'),
    getByDate: (date: string) => fetchApi<WorkoutDay>(`/exercise/${date}`),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return fetchApi<WorkoutDay[]>(`/exercise${qs}`)
    },
    updateDay: (date: string, data: WorkoutDayUpdate) =>
      fetchApi<WorkoutDay>(`/exercise/${date}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDay: (date: string) => fetchApi<void>(`/exercise/${date}`, { method: 'DELETE' }),
    createExercise: (data: WorkoutExerciseCreate) =>
      fetchApi<WorkoutExercise>('/exercise/exercises', { method: 'POST', body: JSON.stringify(data) }),
    updateExercise: (id: string, data: WorkoutExerciseUpdate) =>
      fetchApi<WorkoutExercise>(`/exercise/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteExercise: (id: string) => fetchApi<void>(`/exercise/exercises/${id}`, { method: 'DELETE' }),
    suggest: (date: string, context?: DailyContextInput) =>
      fetchApi<WorkoutDay>(`/exercise/${date}/suggest`, { method: 'POST', body: context ? JSON.stringify(context) : undefined }),
    calculateCalories: (date: string) =>
      fetchApi<WorkoutDay>(`/exercise/${date}/calculate-calories`, { method: 'POST' }),
    coachMessage: (date: string) =>
      fetchApi<WorkoutDay>(`/exercise/${date}/coach-message`, { method: 'POST' }),
    weeklySummary: (weekStart?: string) => {
      const qs = weekStart ? `?week_start=${weekStart}` : ''
      return fetchApi<WorkoutWeekSummary>(`/exercise/summary/week${qs}`)
    },
  },
}
