// ─── Core Enums & Primitives ───────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'owner' | 'admin' | 'member' | 'guest';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

// ─── View Types ─────────────────────────────────────────────────────────────

export type ProjectView = 'board' | 'list' | 'timeline' | 'calendar' | 'table' | 'workload';

// ─── Users & Auth ───────────────────────────────────────────────────────────

export interface User {
  id: string;
  tenantId?: string;          // which organisation this user belongs to — used for multi-tenant isolation
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  departmentId?: string;
  jobTitle?: string;
  timezone?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export type PermissionKey =
  | 'projects.read'
  | 'projects.write'
  | 'tasks.read'
  | 'tasks.write'
  | 'members.read'
  | 'members.write'
  | 'billing.read'
  | 'settings.write'
  | 'automation.write'
  | 'reports.read'
  | 'compliance.read'
  | 'compliance.write'
  | 'goals.read'
  | 'goals.write'
  | 'sprints.write';

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  userIds: string[];
  system: boolean;
  createdAt: string;
}

// ─── Workspace & Tenant ──────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  /** Legacy: primary business type selected at onboarding ('restaurant' | 'crm' | 'hr' | 'cosmetics' | ...). */
  businessType?: string | null;
  /**
   * Set of modules the tenant activated at onboarding (and via add-ons afterwards).
   * Drives which modules appear on the Business dashboard and in the Business module dock.
   * Valid values mirror BusinessModuleKey plus the 'restaurant' vertical.
   */
  enabledModules?: string[];
}

// ─── Projects & Spaces ───────────────────────────────────────────────────────

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed' | 'on_hold';
  progress: number;
  ownerId: string;
  createdAt: string;
  templateId?: string;
  color?: string;
  icon?: string;
  startDate?: string;
  dueDate?: string;
  memberIds?: string[];
  defaultView?: ProjectView;
  customStatuses?: CustomStatus[];
}

export interface CustomStatus {
  id: string;
  label: string;
  color: string;
  category: 'todo' | 'active' | 'done' | 'cancelled';
  order: number;
}

// ─── Lists (ClickUp-style lists within a project) ────────────────────────────

export interface TaskList {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  createdAt: string;
  sprintId?: string;
  isDefault?: boolean;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  projectId: string;
  listId?: string;
  milestoneId?: string;
  sprintId?: string;
  parentTaskId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeIds?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedMinutes?: number;
  loggedMinutes?: number;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  subtasks: Subtask[];
  comments: Comment[];
  timeEntries: TimeEntry[];
  attachments: FileAttachment[];
  customFields?: Record<string, CustomFieldValue>;
  dependencies?: TaskDependency[];
  order?: number;
  storyPoints?: number;
  watchers?: string[];
  coverColor?: string;
  isRecurring?: boolean;
  recurringConfig?: RecurringConfig;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of';
}

// ─── Subtasks ────────────────────────────────────────────────────────────────

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mentions?: string[];
  reactions?: CommentReaction[];
  editedAt?: string;
  isEdited?: boolean;
  createdAt: string;
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
}

// ─── Time Tracking ───────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  minutes: number;
  description: string;
  loggedAt: string;
  billable?: boolean;
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export interface FileAttachment {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

// ─── Custom Fields ───────────────────────────────────────────────────────────

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url' | 'email' | 'phone' | 'currency' | 'rating' | 'formula';

export interface CustomField {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
  required?: boolean;
  defaultValue?: string;
  order: number;
  createdAt: string;
}

export type CustomFieldValue = string | number | boolean | string[] | null;

// ─── Milestones ──────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'at_risk' | 'completed';
  color?: string;
  taskIds?: string[];
  createdAt: string;
}

// ─── Sprints ─────────────────────────────────────────────────────────────────

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  velocity?: number;
  completedPoints?: number;
  plannedPoints?: number;
  createdAt: string;
}

// ─── Goals & OKRs ────────────────────────────────────────────────────────────

export type GoalStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'draft';

export interface Goal {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: GoalStatus;
  progress: number;
  ownerId: string;
  startDate: string;
  dueDate: string;
  parentGoalId?: string;
  projectIds?: string[];
  keyResults: KeyResult[];
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  type: 'number' | 'percentage' | 'currency' | 'boolean';
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string;
  progress: number;
  createdAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_comment'
  | 'task_status_changed'
  | 'milestone_due'
  | 'sprint_started'
  | 'sprint_ended'
  | 'goal_updated'
  | 'mention'
  | 'invitation'
  | 'project_updated';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  actorName?: string;
  actorAvatar?: string;
  entityId?: string;
  entityType?: 'task' | 'project' | 'sprint' | 'goal' | 'comment';
  createdAt: string;
}

// ─── Saved Views / Filters ────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  projectId?: string;
  name: string;
  viewType: ProjectView;
  filters: ViewFilter[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  groupBy?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface ViewFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty';
  value: string | string[] | number | boolean;
}

// ─── Docs ─────────────────────────────────────────────────────────────────────

export interface Doc {
  id: string;
  projectId?: string;
  tenantId: string;
  title: string;
  content: string;
  icon?: string;
  parentDocId?: string;
  authorId: string;
  authorName: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultTasks: Array<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
  }>;
  isDefault: boolean;
  createdAt: string;
}

// ─── Invitations ──────────────────────────────────────────────────────────────

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
}

// ─── Email Notifications ─────────────────────────────────────────────────────

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent';
  createdAt: string;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: 'success' | 'failed';
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  type:
    | 'tenant_created'
    | 'workspace_created'
    | 'project_created'
    | 'project_updated'
    | 'task_created'
    | 'task_status_changed'
    | 'task_assigned'
    | 'task_due_date_set'
    | 'comment_added'
    | 'invitation_sent'
    | 'invitation_accepted'
    | 'role_updated'
    | 'milestone_created'
    | 'milestone_completed'
    | 'time_logged'
    | 'attachment_added'
    | 'webhook_triggered'
    | 'template_used'
    | 'sso_configured'
    | 'scim_synced'
    | 'role_created'
    | 'automation_run'
    | 'portfolio_updated'
    | 'region_changed'
    | 'compliance_checked'
    | 'warehouse_exported'
    | 'ai_summary_generated'
    | 'recommendations_refreshed'
    | 'risk_alert_generated'
    | 'nl_report_generated'
    | 'tasks_reprioritized'
    | 'sprint_created'
    | 'sprint_started'
    | 'sprint_completed'
    | 'goal_created'
    | 'goal_updated'
    | 'list_created'
    | 'doc_created';
  actorName: string;
  message: string;
  createdAt: string;
  entityId?: string;
  entityType?: string;
}

// ─── Scale / Enterprise ──────────────────────────────────────────────────────

export interface SsoConfig {
  id: string;
  provider: 'okta' | 'azure_ad' | 'google_workspace' | 'custom_saml';
  enabled: boolean;
  domain: string;
  signInUrl: string;
  issuer: string;
  certificateFingerprint: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScimConfig {
  id: string;
  enabled: boolean;
  endpoint: string;
  tokenPreview: string;
  lastSyncAt?: string;
  usersProvisioned: number;
  groupsProvisioned: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  active: boolean;
  trigger: 'task.created' | 'task.overdue' | 'milestone.completed' | 'project.completed' | 'webhook.received' | 'status.changed' | 'sprint.started';
  conditions: string[];
  actions: string[];
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  projectIds: string[];
  targetDate?: string;
  budgetUsd?: number;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  leadUserId?: string;
  createdAt: string;
}

export interface RegionConfig {
  id: string;
  code: 'us-east' | 'us-west' | 'eu-west' | 'ap-south';
  active: boolean;
  primary: boolean;
  dataResidency: string;
  latencyMs: number;
  requestRatePerMin: number;
  createdAt: string;
}

export interface EventStreamStat {
  id: string;
  stream: string;
  throughputPerMin: number;
  errorRatePct: number;
  lagMs: number;
  deadLetterCount: number;
  updatedAt: string;
}

export interface ComplianceControl {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA';
  controlId: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  ownerId?: string;
  evidenceCount: number;
  nextReviewDate: string;
}

export interface AnalyticsView {
  id: string;
  name: string;
  query: string;
  refreshIntervalMinutes: number;
  lastComputedAt?: string;
  createdAt: string;
}

export interface WarehouseExportJob {
  id: string;
  destination: 'bigquery' | 'snowflake' | 'redshift' | 'azure_synapse';
  frequency: 'hourly' | 'daily' | 'weekly';
  dataset: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRunAt?: string;
  rowCount: number;
  createdAt: string;
}

// ─── AI & Intelligence ───────────────────────────────────────────────────────

export interface AIInsightRecommendation {
  id: string;
  title: string;
  reason: string;
  impactScore: number;
  taskId?: string;
  projectId?: string;
  createdAt: string;
}

export interface DeliveryRiskAlert {
  id: string;
  projectId: string;
  projectName: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high';
  drivers: string[];
  createdAt: string;
}

export interface NaturalLanguageReport {
  id: string;
  query: string;
  answer: string;
  createdAt: string;
}

export interface IntelligentPriorityResult {
  id: string;
  taskId: string;
  taskTitle: string;
  fromPriority: TaskPriority;
  toPriority: TaskPriority;
  reason: string;
  createdAt: string;
}
