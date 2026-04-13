export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  departmentId?: string;
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
  | 'compliance.write';

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
  userIds: string[];
  system: boolean;
  createdAt: string;
}

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
  trigger: 'task.created' | 'task.overdue' | 'milestone.completed' | 'project.completed' | 'webhook.received';
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

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  minutes: number;
  description: string;
  loggedAt: string;
}

export interface FileAttachment {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
  estimatedMinutes?: number;
  tags: string[];
  createdAt: string;
  createdBy: string;
  subtasks: Subtask[];
  comments: Comment[];
  timeEntries: TimeEntry[];
  attachments: FileAttachment[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
  ownerId: string;
  createdAt: string;
  templateId?: string;
  color?: string;
}

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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
}

export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent';
  createdAt: string;
}

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
    | 'tasks_reprioritized';
  actorName: string;
  message: string;
  createdAt: string;
}