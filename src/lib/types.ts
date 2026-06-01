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
  estimated_seconds?: number | null
  category?: string
  meeting_time?: string
  external_url?: string
  tag?: string
  recurrence_type: RecurringTaskType
  recurrence_days: number[] | null
  reminder_minutes_before?: number | null
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
  estimated_seconds?: number | null
  category?: string
  meeting_time?: string
  tag?: string
  reminder_minutes_before?: number | null
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
  reminder_minutes_before?: number | null
  priority: Priority
  status: DailyTaskStatus
  estimated_seconds?: number | null
  total_seconds: number
  live_total_seconds?: number
  sort_order: number
  started_at?: string
  completed_at?: string
  subtasks: DailySubtask[]
  emotion_entries?: EmotionEntry[]
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

export type TaskEmotionPhase = 'before' | 'after'

export type EmotionStrategyHelped = 'yes' | 'partial' | 'no'

export interface EmotionEntry {
  id: string
  daily_plan_id?: string | null
  daily_task_id?: string | null
  project_id?: string | null
  task_phase?: TaskEmotionPhase | null
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

export interface DailyReflection {
  id: string
  user_id: string
  daily_plan_id?: string | null
  went_well?: string | null
  drained_me?: string | null
  learned?: string | null
  grateful_for?: string | null
  improve_tomorrow?: string | null
  mood_rating?: number | null
  energy_rating?: number | null
  productivity_rating?: number | null
  note?: string | null
  created_at: string
  updated_at: string
}

export interface DailyReflectionInput {
  went_well?: string
  drained_me?: string
  learned?: string
  grateful_for?: string
  improve_tomorrow?: string
  mood_rating?: number
  energy_rating?: number
  productivity_rating?: number
  note?: string
}

export interface DailyReflectionSummary {
  period_start: string
  period_end: string
  total_reflections: number
  days_with_reflection: number
  days_without_reflection: number
  avg_mood?: number | null
  avg_energy?: number | null
  avg_productivity?: number | null
  mood_trend: 'up' | 'down' | 'stable'
  energy_trend: 'up' | 'down' | 'stable'
  productivity_trend: 'up' | 'down' | 'stable'
}

export interface SleepLog {
  id: string
  user_id: string
  daily_plan_id?: string | null
  date: string
  hours_slept?: number | null
  sleep_quality?: number | null
  bedtime?: string | null
  wake_time?: string | null
  wakeups?: number | null
  tiredness_on_wake?: number | null
  tiredness_during_day?: number | null
  note?: string | null
  created_at: string
  updated_at: string
}

export interface SleepLogInput {
  date?: string
  hours_slept?: number
  sleep_quality?: number
  bedtime?: string
  wake_time?: string
  wakeups?: number
  tiredness_on_wake?: number
  tiredness_during_day?: number
  note?: string
}

export interface SleepLogSummary {
  period_start: string
  period_end: string
  total_logs: number
  days_with_log: number
  days_without_log: number
  avg_hours_slept?: number | null
  avg_sleep_quality?: number | null
  avg_wakeups?: number | null
  avg_tiredness_on_wake?: number | null
  avg_tiredness_during_day?: number | null
  hours_trend: 'up' | 'down' | 'stable'
  quality_trend: 'up' | 'down' | 'stable'
}

export type Sex = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type NutritionGoal = 'lose' | 'maintain' | 'gain'

export type NutritionDayStatus = 'draft' | 'analyzed'

export interface HealthProfile {
  id: string
  user_id: string
  sex: Sex
  birth_date: string
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  goal: NutritionGoal
  target_calories_override?: number | null
  glass_ml: number
  age: number
  bmr: number
  tdee: number
  recommended_calories: number
  created_at: string
  updated_at: string
}

export interface HealthProfileInput {
  sex: Sex
  birth_date: string
  height_cm: number
  weight_kg: number
  activity_level: ActivityLevel
  goal: NutritionGoal
  target_calories_override?: number | null
  glass_ml: number
}

export interface MealEntry {
  id: string
  user_id: string
  daily_plan_id?: string | null
  date: string
  label: string
  description: string
  sort_order: number
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  sugar_g?: number | null
  fat_g?: number | null
  fiber_g?: number | null
  ai_notes?: string | null
  created_at: string
  updated_at: string
}

export interface MealEntryInput {
  date?: string
  label?: string
  description: string
}

export interface MealEntryUpdate {
  label?: string
  description?: string
  sort_order?: number
}

export interface ExerciseEntry {
  id: string
  user_id: string
  daily_plan_id?: string | null
  date: string
  label: string
  description: string
  sort_order: number
  calories_burned?: number | null
  duration_min?: number | null
  intensity?: string | null
  ai_notes?: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseEntryInput {
  date?: string
  label?: string
  description: string
}

export interface ExerciseEntryUpdate {
  label?: string
  description?: string
  sort_order?: number
}

export interface NutritionDay {
  id: string
  user_id: string
  daily_plan_id?: string | null
  date: string
  water_ml: number
  day_note?: string | null
  status: NutritionDayStatus
  analyzed_at?: string | null
  ai_model?: string | null
  ai_summary?: string | null
  recommended_calories?: number | null
  consumed_calories?: number | null
  burned_calories?: number | null
  balance_calories?: number | null
  total_protein_g?: number | null
  total_carbs_g?: number | null
  total_sugar_g?: number | null
  total_fat_g?: number | null
  total_fiber_g?: number | null
  meals: MealEntry[]
  exercises: ExerciseEntry[]
  created_at: string
  updated_at: string
}

export interface NutritionDaySummary {
  period_start: string
  period_end: string
  total_days: number
  analyzed_days: number
  avg_recommended_calories?: number | null
  avg_consumed_calories?: number | null
  avg_burned_calories?: number | null
  avg_balance_calories?: number | null
  total_water_ml: number
  avg_protein_g?: number | null
  avg_carbs_g?: number | null
  avg_sugar_g?: number | null
  avg_fat_g?: number | null
}

export type ConditionCategory = 'cardiovascular' | 'metabolic' | 'dental' | 'mental' | 'respiratory' | 'other'

export type ConditionStatus = 'active' | 'monitoring' | 'resolved'

export type GuidelineKind = 'avoid' | 'helps' | 'action'

export type EpisodeType = 'cold' | 'flu' | 'physical' | 'mental' | 'other'

export interface HealthGuideline {
  id: string
  condition_id: string
  kind: GuidelineKind
  text: string
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HealthGuidelineInput {
  kind: GuidelineKind
  text: string
  is_done?: boolean
  sort_order?: number
}

export interface HealthGuidelineUpdate {
  kind?: GuidelineKind
  text?: string
  is_done?: boolean
  sort_order?: number
}

export interface HealthReminder {
  id: string
  condition_id: string
  text: string
  time_of_day?: string | null
  frequency: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HealthReminderInput {
  text: string
  time_of_day?: string | null
  frequency?: string
  is_active?: boolean
  sort_order?: number
}

export interface HealthReminderUpdate {
  text?: string
  time_of_day?: string | null
  frequency?: string
  is_active?: boolean
  sort_order?: number
}

export interface HealthCondition {
  id: string
  user_id: string
  name: string
  category: ConditionCategory
  status: ConditionStatus
  description?: string | null
  diagnosed_on?: string | null
  notes?: string | null
  guidelines: HealthGuideline[]
  reminders: HealthReminder[]
  created_at: string
  updated_at: string
}

export interface HealthConditionInput {
  name: string
  category?: ConditionCategory
  status?: ConditionStatus
  description?: string | null
  diagnosed_on?: string | null
  notes?: string | null
}

export interface HealthConditionUpdate {
  name?: string
  category?: ConditionCategory
  status?: ConditionStatus
  description?: string | null
  diagnosed_on?: string | null
  notes?: string | null
}

export interface GuidelineSuggestion {
  avoid: string[]
  helps: string[]
  action_plan: string[]
}

export interface SicknessEpisode {
  id: string
  user_id: string
  condition_id?: string | null
  episode_type: EpisodeType
  title: string
  started_on: string
  ended_on?: string | null
  severity?: number | null
  symptoms?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface SicknessEpisodeInput {
  condition_id?: string | null
  episode_type: EpisodeType
  title: string
  started_on: string
  ended_on?: string | null
  severity?: number | null
  symptoms?: string | null
  notes?: string | null
}

export interface SicknessEpisodeUpdate {
  condition_id?: string | null
  episode_type?: EpisodeType
  title?: string
  started_on?: string
  ended_on?: string | null
  severity?: number | null
  symptoms?: string | null
  notes?: string | null
}

export interface SicknessEpisodeSummary {
  period_start: string
  period_end: string
  total: number
  by_type: Record<string, number>
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export type HabitCategory = 'substance' | 'behavior' | 'digital' | 'other'
export type HabitTrackingMode = 'abstinence' | 'control'
export type HabitStatus = 'active' | 'paused' | 'achieved' | 'abandoned'
export type HabitEventType = 'check_in' | 'urge' | 'relapse'

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  tracking_mode: HabitTrackingMode
  status: HabitStatus
  motivation?: string | null
  triggers: string[]
  coping_strategies: string[]
  action_plan?: string | null
  start_date: string
  created_at: string
  updated_at: string
}

export interface HabitCreate {
  name: string
  category?: HabitCategory
  tracking_mode?: HabitTrackingMode
  motivation?: string
  triggers?: string[]
  coping_strategies?: string[]
  action_plan?: string
  start_date?: string
}

export interface HabitUpdate {
  name?: string
  category?: HabitCategory
  tracking_mode?: HabitTrackingMode
  status?: HabitStatus
  motivation?: string | null
  triggers?: string[]
  coping_strategies?: string[]
  action_plan?: string | null
  start_date?: string
}

export interface HabitEvent {
  id: string
  habit_id: string
  event_type: HabitEventType
  occurred_at: string
  intensity?: number | null
  emotion?: string | null
  trigger?: string | null
  feeling_note?: string | null
  thought?: string | null
  action_taken?: string | null
  resisted?: boolean | null
  breathing_used: boolean
  emotion_entry_id?: string | null
  note?: string | null
  created_at: string
  updated_at: string
}

export interface HabitEventCreate {
  event_type: HabitEventType
  occurred_at?: string
  intensity?: number
  emotion?: string
  trigger?: string
  feeling_note?: string
  thought?: string
  action_taken?: string
  resisted?: boolean
  breathing_used?: boolean
  note?: string
  mirror_to_emotions?: boolean
}

export interface HabitEventUpdate {
  event_type?: HabitEventType
  occurred_at?: string
  intensity?: number
  emotion?: string
  trigger?: string
  feeling_note?: string
  thought?: string
  action_taken?: string
  resisted?: boolean
  breathing_used?: boolean
  note?: string
}

export interface HabitMetrics {
  current_streak_days: number
  longest_streak_days: number
  days_since_last_relapse: number | null
  total_relapses: number
  total_urges: number
  urges_resisted: number
  urge_resistance_rate: number
}

export interface HabitSummary {
  start_date: string
  end_date: string
  total_events: number
  relapses: number
  urges: number
  check_ins: number
  urges_resisted: number
  urge_resistance_rate: number
  dominant_trigger?: string | null
  dominant_emotion?: string | null
  avg_intensity: number
  metrics: HabitMetrics
}

export interface JiraTestResult {
  ok: boolean
  account_id?: string | null
  display_name?: string | null
  email?: string | null
  error?: string | null
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export type FinanceEntryType = 'income' | 'expense'

export interface FinanceEntry {
  id: string
  date: string
  type: FinanceEntryType
  amount: number
  category: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface FinanceEntryCreate {
  date: string
  type: FinanceEntryType
  amount: number
  category: string
  description?: string | null
}

export interface FinanceEntryUpdate {
  date?: string
  type?: FinanceEntryType
  amount?: number
  category?: string
  description?: string | null
}

export interface FinanceSummary {
  date: string
  total_income: number
  total_expense: number
  opening_balance: number
  daily_balance: number
  balance: number
}
