export type ProjectType = 'work' | 'business' | 'partner' | 'personal'

export type TaskSource = 'manual' | 'jira'

export type TaskStatus = 'backlog' | 'active' | 'done' | 'archived'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type DailyTaskStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'rolled_over' | 'skipped'

export type SubtaskStatus = 'pending' | 'in_progress' | 'completed'

export type DailyPlanStatus = 'open' | 'closed'

export type RecurringTaskType = 'daily' | 'weekly' | 'monthly'

export type RecurringInstanceStatus = 'pending' | 'completed' | 'skipped'

export interface RecurringTask {
  id: string
  project_id: string
  title: string
  description?: string
  priority: Priority
  category?: string
  recurrence_type: RecurringTaskType
  recurrence_days: number[] | null
  is_active: boolean
  created_at: string
  updated_at: string
  project?: Project
  instances_count: number
  completed_count: number
}

export interface RecurringInstance {
  id: string
  recurring_task_id: string
  date: string
  daily_task_id?: string
  status: RecurringInstanceStatus
  completed_at?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  type: ProjectType
  color: string
  is_active: boolean
  created_at: string
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  status: SubtaskStatus
  priority: Priority
  sort_order: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  source: TaskSource
  external_key?: string
  external_url?: string
  status: TaskStatus
  priority: Priority
  due_date?: string
  category?: string
  meeting_time?: string
  subtasks?: Subtask[]
  created_at: string
  updated_at: string
  is_recurring?: boolean
  recurring_task_id?: string
}

export interface DailySubtask {
  id: string
  daily_task_id: string
  title: string
  status: SubtaskStatus
  priority: Priority
  sort_order: number
}

export interface DailyTask {
  id: string
  daily_plan_id: string
  task_id?: string
  recurring_task_id?: string
  title_snapshot: string
  description?: string
  external_key?: string
  external_url?: string
  category?: string
  meeting_time?: string
  priority: Priority
  status: DailyTaskStatus
  total_seconds: number
  sort_order: number
  started_at?: string
  completed_at?: string
  subtasks: DailySubtask[]
  project?: Project
  task?: Task
  recurring_task?: RecurringTask
}

export interface DailyPlan {
  id: string
  date: string
  status: DailyPlanStatus
  notes?: string
  tasks: DailyTask[]
  created_at: string
}

export interface TimerSession {
  id: string
  daily_task_id: string
  started_at: string
  stopped_at?: string
  duration_seconds: number
}

export interface HistoryDay {
  plan_id: string
  date: string
  status: DailyPlanStatus
  total_tasks: number
  completed_tasks: number
  rolled_over_tasks: number
  total_seconds: number
  tasks: DailyTask[]
}

export interface TaskComment {
  id: string
  task_id?: string | null
  recurring_task_id?: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface JiraConnection {
  id: string
  name: string
  base_url: string
  email: string
  jql: string
  project_id: string
  enabled: boolean
  last_sync_at?: string | null
  last_sync_status?: string | null
  last_sync_error?: string | null
  created_at: string
  updated_at: string
}

export interface JiraSyncResult {
  connection_id: string
  connection_name: string
  created: number
  updated: number
  skipped: number
  errors: string[]
  status: string
}

export interface JiraTestResult {
  ok: boolean
  account_id?: string | null
  display_name?: string | null
  email?: string | null
  error?: string | null
}
