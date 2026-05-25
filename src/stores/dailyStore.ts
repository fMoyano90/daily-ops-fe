import { create } from 'zustand'
import { DailyTask, DailySubtask, DailyTaskStatus, SubtaskStatus } from '@/lib/types'

interface TimerState {
  activeTaskId: string | null
  running: boolean
  elapsedSeconds: number
  intervalId: NodeJS.Timeout | null
}

interface DailyStore {
  timer: TimerState
  tasks: DailyTask[]
  selectedForToday: string[]

  startTimer: (taskId: string) => void
  pauseTimer: () => void
  stopTimer: () => void
  resetTimer: () => void

  updateTaskStatus: (taskId: string, status: DailyTaskStatus) => void
  addSubtask: (dailyTaskId: string, title: string) => void
  updateSubtaskStatus: (subtaskId: string, status: SubtaskStatus) => void
  removeSubtask: (subtaskId: string) => void
  reorderTasks: (taskIds: string[]) => void
  updateTaskPriority: (taskId: string, priority: DailyTask['priority']) => void

  toggleSelectTask: (taskId: string) => void
  clearSelection: () => void
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  timer: {
    activeTaskId: null,
    running: false,
    elapsedSeconds: 0,
    intervalId: null,
  },
  tasks: [],
  selectedForToday: [],

  startTimer: (taskId: string) => {
    const { timer } = get()
    if (timer.intervalId) clearInterval(timer.intervalId)

    const intervalId = setInterval(() => {
      set((state) => ({
        timer: { ...state.timer, elapsedSeconds: state.timer.elapsedSeconds + 1 },
      }))
    }, 1000)

    set({
      timer: { activeTaskId: taskId, running: true, elapsedSeconds: 0, intervalId },
    })
  },

  pauseTimer: () => {
    const { timer } = get()
    if (timer.intervalId) clearInterval(timer.intervalId)
    set({ timer: { ...timer, running: false } })
  },

  stopTimer: () => {
    const { timer } = get()
    if (timer.intervalId) clearInterval(timer.intervalId)
    set({ timer: { activeTaskId: null, running: false, elapsedSeconds: 0, intervalId: null } })
  },

  resetTimer: () => {
    const { timer } = get()
    if (timer.intervalId) clearInterval(timer.intervalId)
    set({ timer: { activeTaskId: null, running: false, elapsedSeconds: 0, intervalId: null } })
  },

  updateTaskStatus: (taskId: string, status: DailyTaskStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : t.completed_at,
            }
          : t
      ),
    }))
  },

  addSubtask: (dailyTaskId: string, title: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === dailyTaskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                {
                  id: `st-${Date.now()}`,
                  daily_task_id: dailyTaskId,
                  title,
                  status: 'pending' as SubtaskStatus,
                  priority: 'medium' as const,
                  sort_order: t.subtasks.length + 1,
                },
              ],
            }
          : t
      ),
    }))
  },

  updateSubtaskStatus: (subtaskId: string, status: SubtaskStatus) => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, status } : st
        ),
      })),
    }))
  },

  removeSubtask: (subtaskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks.filter((st) => st.id !== subtaskId),
      })),
    }))
  },

  reorderTasks: (taskIds: string[]) => {
    set((state) => {
      const taskMap = new Map(state.tasks.map((t) => [t.id, t]))
      const reordered = taskIds.map((id) => taskMap.get(id)!).filter(Boolean)
      return { tasks: reordered.map((t, i) => ({ ...t, sort_order: i + 1 })) }
    })
  },

  updateTaskPriority: (taskId: string, priority: DailyTask['priority']) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, priority } : t
      ),
    }))
  },

  toggleSelectTask: (taskId: string) => {
    set((state) => {
      const selected = state.selectedForToday.includes(taskId)
        ? state.selectedForToday.filter((id) => id !== taskId)
        : [...state.selectedForToday, taskId]
      return { selectedForToday: selected }
    })
  },

  clearSelection: () => {
    set({ selectedForToday: [] })
  },
}))
