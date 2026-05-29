export interface User {
  id: string
  email: string
  display_name: string
  is_active: boolean
}

export type ProjectType = 'work' | 'business' | 'partner' | 'personal'

export type TaskSource = 'manual' | 'jira' | 'recurring'

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
  meeting_time?: string
  external_url?: string
  tag?: string
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
  tag?: string
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
  tag?: string
  category?: string
  due_date?: string
  meeting_time?: string
  priority: Priority
  status: DailyTaskStatus
  total_seconds: number
  live_total_seconds?: number
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

export type GoalHorizon = 'short' | 'medium' | 'long'

export type GoalStatus = 'active' | 'achieved' | 'paused' | 'abandoned'

export type GoalStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export interface Goal {
  id: string
  project_id: string
  title: string
  description?: string
  horizon: GoalHorizon
  status: GoalStatus
  progress: number
  start_date: string
  target_date: string
  completed_at?: string
  created_at: string
  updated_at: string
  project?: Project
  steps: GoalStep[]
  comments: GoalComment[]
  linked_task_ids: string[]
  anti_goals?: string
  key_results?: string
}

export interface GoalStep {
  id: string
  goal_id: string
  title: string
  status: GoalStepStatus
  sort_order: number
  linked_task_id?: string
  due_date?: string
  completed_at?: string
  created_at: string
}

export interface GoalComment {
  id: string
  goal_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface GoalSummary {
  short: { count: number; avg_progress: number; nearest_deadline?: string; nearest_goal_title?: string }
  medium: { count: number; avg_progress: number; nearest_deadline?: string; nearest_goal_title?: string }
  long: { count: number; avg_progress: number; nearest_deadline?: string; nearest_goal_title?: string }
}

export type EmotionValence = 'pleasant' | 'neutral' | 'unpleasant'

export type EmotionEnergy = 'low' | 'medium' | 'high'

export type EmotionStrategyHelped = 'yes' | 'partial' | 'no'

export interface EmotionEntry {
  id: string
  daily_plan_id?: string | null
  daily_task_id?: string | null
  project_id?: string | null
  emotion: string
  secondary_emotions: string[]
  intensity: number
  valence: EmotionValence
  energy: EmotionEnergy
  trigger_type?: string | null
  trigger_note?: string | null
  body_sensation?: string | null
  thought?: string | null
  need?: string | null
  response?: string | null
  regulation_strategy?: string | null
  strategy_helped?: EmotionStrategyHelped | null
  note?: string | null
  occurred_at: string
  created_at: string
  updated_at: string
}

export interface EmotionSummary {
  start_date: string
  end_date: string
  total_entries: number
  average_intensity: number
  dominant_emotion?: string | null
  dominant_trigger?: string | null
  unpleasant_count: number
  pleasant_count: number
  neutral_count: number
  by_emotion: Record<string, number>
  by_trigger: Record<string, number>
  by_valence: Record<string, number>
}

export interface JiraTestResult {
  ok: boolean
  account_id?: string | null
  display_name?: string | null
  email?: string | null
  error?: string | null
}
