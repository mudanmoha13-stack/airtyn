"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AIInsightRecommendation,
  AnalyticsView,
  ActivityEvent,
  AuditLogEntry,
  Comment,
  ComplianceControl,
  CustomRole,
  Department,
  DeliveryRiskAlert,
  EmailNotification,
  EventStreamStat,
  FileAttachment,
  IntelligentPriorityResult,
  Invitation,
  Milestone,
  NaturalLanguageReport,
  Portfolio,
  Project,
  ProjectTemplate,
  RegionConfig,
  ScimConfig,
  SsoConfig,
  Task,
  TimeEntry,
  WebhookConfig,
  WarehouseExportJob,
  WorkflowAutomation,
  TaskStatus,
  Tenant,
  User,
  UserRole,
  Workspace,
} from './types';

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-software-launch',
    name: 'Software Launch',
    description: 'End-to-end product launch workflow for engineering teams.',
    icon: '🚀',
    color: '#6366f1',
    isDefault: true,
    createdAt: new Date().toISOString(),
    defaultTasks: [
      { title: 'Define requirements', description: 'Gather and document feature requirements.', status: 'todo', priority: 'high' },
      { title: 'Design mockups', description: 'Create UI/UX wireframes and prototypes.', status: 'todo', priority: 'high' },
      { title: 'Set up CI/CD pipeline', description: 'Configure automated builds and deployments.', status: 'todo', priority: 'medium' },
      { title: 'Implement core features', description: 'Build out the primary functionality.', status: 'todo', priority: 'high' },
      { title: 'Write tests', description: 'Unit, integration and E2E test coverage.', status: 'todo', priority: 'medium' },
      { title: 'QA review', description: 'Manual and automated quality assurance.', status: 'todo', priority: 'medium' },
      { title: 'Staging deployment', description: 'Deploy to staging environment.', status: 'todo', priority: 'low' },
      { title: 'Production release', description: 'Go live with proper monitoring.', status: 'todo', priority: 'urgent' },
    ],
  },
  {
    id: 'tpl-marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Structured workflow for planning and executing marketing campaigns.',
    icon: '📣',
    color: '#ec4899',
    isDefault: true,
    createdAt: new Date().toISOString(),
    defaultTasks: [
      { title: 'Define campaign goals', description: 'Set KPIs and success metrics.', status: 'todo', priority: 'high' },
      { title: 'Audience research', description: 'Identify target segments and personas.', status: 'todo', priority: 'high' },
      { title: 'Content creation', description: 'Write copy, design visuals, record video.', status: 'todo', priority: 'medium' },
      { title: 'Channel setup', description: 'Configure email, social, paid channels.', status: 'todo', priority: 'medium' },
      { title: 'Launch campaign', description: 'Go live across all channels.', status: 'todo', priority: 'urgent' },
      { title: 'Monitor performance', description: 'Track metrics and optimise.', status: 'todo', priority: 'medium' },
    ],
  },
  {
    id: 'tpl-onboarding',
    name: 'Employee Onboarding',
    description: 'Smooth onboarding checklist for new team members.',
    icon: '🎉',
    color: '#10b981',
    isDefault: true,
    createdAt: new Date().toISOString(),
    defaultTasks: [
      { title: 'Send welcome email', description: 'Welcome new hire with first-day instructions.', status: 'todo', priority: 'high' },
      { title: 'Set up accounts', description: 'Create email, Slack, and tool access.', status: 'todo', priority: 'high' },
      { title: 'Schedule intro meetings', description: 'Meet team leads and key stakeholders.', status: 'todo', priority: 'medium' },
      { title: 'Assign buddy / mentor', description: 'Pair new hire with an experienced team member.', status: 'todo', priority: 'medium' },
      { title: 'Complete compliance training', description: 'Required legal and security training modules.', status: 'todo', priority: 'medium' },
      { title: '30-day check-in', description: 'First milestone review with manager.', status: 'todo', priority: 'low' },
    ],
  },
  {
    id: 'tpl-bug-triage',
    name: 'Bug Triage',
    description: 'Systematic bug discovery, prioritisation and resolution flow.',
    icon: '🐛',
    color: '#f59e0b',
    isDefault: true,
    createdAt: new Date().toISOString(),
    defaultTasks: [
      { title: 'Reproduce issue', description: 'Confirm the bug is reproducible in target environment.', status: 'todo', priority: 'high' },
      { title: 'Assign severity', description: 'Label P0/P1/P2 based on user impact.', status: 'todo', priority: 'high' },
      { title: 'Root cause analysis', description: 'Identify and document the root cause.', status: 'todo', priority: 'high' },
      { title: 'Implement fix', description: 'Write and review the code fix.', status: 'todo', priority: 'urgent' },
      { title: 'Regression testing', description: 'Verify fix and ensure no regressions.', status: 'todo', priority: 'medium' },
      { title: 'Deploy hotfix', description: 'Release to production with monitoring.', status: 'todo', priority: 'urgent' },
    ],
  },
  {
    id: 'tpl-sprint-planning',
    name: 'Sprint Planning',
    description: 'Agile sprint template for two-week development cycles.',
    icon: '⚡',
    color: '#3b82f6',
    isDefault: true,
    createdAt: new Date().toISOString(),
    defaultTasks: [
      { title: 'Backlog grooming', description: 'Review and estimate backlog items.', status: 'todo', priority: 'high' },
      { title: 'Sprint goal definition', description: 'Agree on the sprint goal with the team.', status: 'todo', priority: 'high' },
      { title: 'Task breakdown', description: 'Break epics into actionable tasks.', status: 'todo', priority: 'medium' },
      { title: 'Daily standups', description: 'Track progress each morning.', status: 'todo', priority: 'low' },
      { title: 'Mid-sprint review', description: 'Check progress at sprint midpoint.', status: 'todo', priority: 'medium' },
      { title: 'Sprint retrospective', description: 'Review what went well and what to improve.', status: 'todo', priority: 'medium' },
    ],
  },
];

const DEFAULT_REGIONS: RegionConfig[] = [
  { id: 'reg-us-east', code: 'us-east', active: true, primary: true, dataResidency: 'US', latencyMs: 42, requestRatePerMin: 22000, createdAt: new Date().toISOString() },
  { id: 'reg-eu-west', code: 'eu-west', active: false, primary: false, dataResidency: 'EU', latencyMs: 88, requestRatePerMin: 12000, createdAt: new Date().toISOString() },
];

const DEFAULT_EVENT_STATS: EventStreamStat[] = [
  { id: 'evt-task', stream: 'task-events', throughputPerMin: 1250, errorRatePct: 0.2, lagMs: 85, deadLetterCount: 1, updatedAt: new Date().toISOString() },
  { id: 'evt-audit', stream: 'audit-events', throughputPerMin: 900, errorRatePct: 0.1, lagMs: 42, deadLetterCount: 0, updatedAt: new Date().toISOString() },
];

const DEFAULT_COMPLIANCE_CONTROLS: ComplianceControl[] = [
  { id: 'cc-soc2-1', framework: 'SOC2', controlId: 'CC6.1', title: 'Access provisioning approvals', status: 'warn', evidenceCount: 2, nextReviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10) },
  { id: 'cc-gdpr-1', framework: 'GDPR', controlId: 'Art.32', title: 'Encryption at rest verification', status: 'pass', evidenceCount: 4, nextReviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10) },
];

interface AppState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentWorkspace: Workspace | null;
  projects: Project[];
  tasks: Task[];
  users: User[];
  invitations: Invitation[];
  emailNotifications: EmailNotification[];
  activity: ActivityEvent[];
  signIn: (email: string, password: string) => { ok: boolean; message?: string };
  signOut: () => void;
  completeOnboarding: (payload: {
    tenantName: string;
    workspaceName: string;
    name: string;
    email: string;
    password: string;
  }) => void;
  inviteUser: (email: string, role: UserRole) => void;
  acceptInvitation: (invitationId: string, payload: { name: string; password: string }) => { ok: boolean; message?: string };
  updateUserRole: (userId: string, role: UserRole) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'tenantId'>) => void;
  updateProject: (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'progress'>>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'comments' | 'subtasks' | 'createdBy' | 'tags' | 'timeEntries' | 'attachments'>) => void;
  assignTask: (taskId: string, assigneeId: string) => void;
  setTaskDueDate: (taskId: string, dueDate?: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  // Phase 2 — milestones
  milestones: Milestone[];
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => void;
  updateMilestone: (milestoneId: string, updates: Partial<Pick<Milestone, 'title' | 'description' | 'dueDate' | 'status'>>) => void;
  deleteMilestone: (milestoneId: string) => void;
  // Phase 2 — time tracking
  addTimeEntry: (taskId: string, entry: Omit<TimeEntry, 'id' | 'taskId' | 'userId' | 'userName' | 'loggedAt'>) => void;
  deleteTimeEntry: (taskId: string, entryId: string) => void;
  // Phase 2 — attachments
  addAttachment: (taskId: string, attachment: Omit<FileAttachment, 'id' | 'taskId' | 'uploadedBy' | 'uploadedAt'>) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  // Phase 2 — templates
  templates: ProjectTemplate[];
  addTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt' | 'isDefault'>) => void;
  deleteTemplate: (templateId: string) => void;
  createProjectFromTemplate: (templateId: string, projectName: string, projectDescription: string) => void;
  // Phase 2 — webhooks
  webhooks: WebhookConfig[];
  addWebhook: (webhook: Omit<WebhookConfig, 'id' | 'createdAt'>) => void;
  updateWebhook: (webhookId: string, updates: Partial<Pick<WebhookConfig, 'name' | 'url' | 'events' | 'active'>>) => void;
  deleteWebhook: (webhookId: string) => void;
  // Phase 2 — audit log
  auditLog: AuditLogEntry[];
  // Phase 3 — scale
  ssoConfig: SsoConfig | null;
  scimConfig: ScimConfig | null;
  customRoles: CustomRole[];
  automations: WorkflowAutomation[];
  portfolios: Portfolio[];
  departments: Department[];
  regions: RegionConfig[];
  eventStats: EventStreamStat[];
  complianceControls: ComplianceControl[];
  analyticsViews: AnalyticsView[];
  warehouseExports: WarehouseExportJob[];
  configureSso: (config: Omit<SsoConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  configureScim: (config: Omit<ScimConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  syncScim: () => void;
  addCustomRole: (role: Omit<CustomRole, 'id' | 'createdAt' | 'system'>) => void;
  deleteCustomRole: (roleId: string) => void;
  assignUserDepartment: (userId: string, departmentId?: string) => void;
  addDepartment: (department: Omit<Department, 'id' | 'createdAt'>) => void;
  addAutomation: (automation: Omit<WorkflowAutomation, 'id' | 'createdAt' | 'runCount' | 'lastRunAt'>) => void;
  runAutomation: (automationId: string) => void;
  addPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt'>) => void;
  addRegion: (region: Omit<RegionConfig, 'id' | 'createdAt'>) => void;
  toggleRegion: (regionId: string, active: boolean) => void;
  refreshEventStats: () => void;
  addComplianceControl: (control: ComplianceControl) => void;
  runComplianceCheck: () => void;
  addAnalyticsView: (view: Omit<AnalyticsView, 'id' | 'createdAt'>) => void;
  runWarehouseExport: (jobId: string) => void;
  addWarehouseExport: (job: Omit<WarehouseExportJob, 'id' | 'createdAt' | 'status' | 'lastRunAt' | 'rowCount'>) => void;
  // Phase 4 - intelligence
  workspaceAiSummary: string | null;
  workspaceAiSummaryUpdatedAt?: string;
  recommendations: AIInsightRecommendation[];
  riskAlerts: DeliveryRiskAlert[];
  nlReports: NaturalLanguageReport[];
  priorityChanges: IntelligentPriorityResult[];
  setWorkspaceAiSummary: (summary: string) => void;
  refreshRecommendations: () => void;
  refreshRiskAlerts: () => void;
  saveNlReport: (query: string, answer: string) => void;
  runIntelligentPrioritization: () => void;
  canManageMembers: boolean;
  canManageProjects: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);
const STORAGE_KEY = 'pinkplan-app-state-v5';
const DB_SEED_KEY = 'pinkplan-db-seeded-v1';

type PersistedState = {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentTenant: Tenant | null;
  currentWorkspace: Workspace | null;
  projects: Project[];
  tasks: Task[];
  users: User[];
  invitations: Invitation[];
  emailNotifications: EmailNotification[];
  activity: ActivityEvent[];
  credentials: Record<string, string>;
  milestones: Milestone[];
  templates: ProjectTemplate[];
  webhooks: WebhookConfig[];
  auditLog: AuditLogEntry[];
  ssoConfig: SsoConfig | null;
  scimConfig: ScimConfig | null;
  customRoles: CustomRole[];
  automations: WorkflowAutomation[];
  portfolios: Portfolio[];
  departments: Department[];
  regions: RegionConfig[];
  eventStats: EventStreamStat[];
  complianceControls: ComplianceControl[];
  analyticsViews: AnalyticsView[];
  warehouseExports: WarehouseExportJob[];
  workspaceAiSummary: string | null;
  workspaceAiSummaryUpdatedAt?: string;
  recommendations: AIInsightRecommendation[];
  riskAlerts: DeliveryRiskAlert[];
  nlReports: NaturalLanguageReport[];
  priorityChanges: IntelligentPriorityResult[];
};

const INITIAL_STATE: PersistedState = {
  isAuthenticated: false,
  currentUser: null,
  currentTenant: null,
  currentWorkspace: null,
  projects: [],
  tasks: [],
  users: [],
  invitations: [],
  emailNotifications: [],
  activity: [],
  credentials: {},
  milestones: [],
  templates: DEFAULT_TEMPLATES,
  webhooks: [],
  auditLog: [],
  ssoConfig: null,
  scimConfig: null,
  customRoles: [],
  automations: [],
  portfolios: [],
  departments: [
    { id: 'dep-eng', name: 'Engineering', createdAt: new Date().toISOString() },
    { id: 'dep-design', name: 'Design', createdAt: new Date().toISOString() },
    { id: 'dep-growth', name: 'Growth', createdAt: new Date().toISOString() },
  ],
  regions: DEFAULT_REGIONS,
  eventStats: DEFAULT_EVENT_STATS,
  complianceControls: DEFAULT_COMPLIANCE_CONTROLS,
  analyticsViews: [],
  warehouseExports: [],
  workspaceAiSummary: null,
  workspaceAiSummaryUpdatedAt: undefined,
  recommendations: [],
  riskAlerts: [],
  nlReports: [],
  priorityChanges: [],
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      ...INITIAL_STATE,
      ...parsed,
      credentials: parsed.credentials ?? {},
      milestones: parsed.milestones ?? [],
      templates: parsed.templates && parsed.templates.length > 0 ? parsed.templates : DEFAULT_TEMPLATES,
      webhooks: parsed.webhooks ?? [],
      auditLog: parsed.auditLog ?? [],
      ssoConfig: parsed.ssoConfig ?? null,
      scimConfig: parsed.scimConfig ?? null,
      customRoles: parsed.customRoles ?? [],
      automations: parsed.automations ?? [],
      portfolios: parsed.portfolios ?? [],
      departments: parsed.departments ?? INITIAL_STATE.departments,
      regions: parsed.regions && parsed.regions.length > 0 ? parsed.regions : DEFAULT_REGIONS,
      eventStats: parsed.eventStats && parsed.eventStats.length > 0 ? parsed.eventStats : DEFAULT_EVENT_STATS,
      complianceControls: parsed.complianceControls && parsed.complianceControls.length > 0 ? parsed.complianceControls : DEFAULT_COMPLIANCE_CONTROLS,
      analyticsViews: parsed.analyticsViews ?? [],
      warehouseExports: parsed.warehouseExports ?? [],
      workspaceAiSummary: parsed.workspaceAiSummary ?? null,
      workspaceAiSummaryUpdatedAt: parsed.workspaceAiSummaryUpdatedAt,
      recommendations: parsed.recommendations ?? [],
      riskAlerts: parsed.riskAlerts ?? [],
      nlReports: parsed.nlReports ?? [],
      priorityChanges: parsed.priorityChanges ?? [],
      // Migrate existing tasks to have new fields
      tasks: (parsed.tasks ?? []).map((t) => ({
        ...t,
        tags: t.tags ?? [],
        timeEntries: t.timeEntries ?? [],
        attachments: t.attachments ?? [],
      })),
    };
  } catch {
    return INITIAL_STATE;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  const postJson = async (url: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return response.json();
  };

  const upsertUserToApi = async (user: User, tenantId: string) => {
    await postJson('/api/users', {
      id: user.id,
      tenantId,
      departmentId: user.departmentId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  };

  const seedDatabaseFromSnapshot = async (snapshot: PersistedState) => {
    await postJson('/api/seed/local-state', {
      currentTenant: snapshot.currentTenant,
      currentWorkspace: snapshot.currentWorkspace,
      users: snapshot.users,
      projects: snapshot.projects,
      milestones: snapshot.milestones,
      tasks: snapshot.tasks,
    });
  };

  const syncProjectsTasksUsersFromApi = async () => {
    const [projectsResponse, tasksResponse, usersResponse] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/tasks'),
      fetch('/api/users'),
    ]);

    if (!projectsResponse.ok || !tasksResponse.ok || !usersResponse.ok) {
      throw new Error('Failed to sync data from API');
    }

    const [projectsPayload, tasksPayload, usersPayload] = await Promise.all([
      projectsResponse.json() as Promise<{ projects?: Project[] }>,
      tasksResponse.json() as Promise<{ tasks?: Task[] }>,
      usersResponse.json() as Promise<{ users?: User[] }>,
    ]);

    setState((prev) => ({
      ...prev,
      projects: projectsPayload.projects && projectsPayload.projects.length > 0 ? projectsPayload.projects : prev.projects,
      tasks: tasksPayload.tasks && tasksPayload.tasks.length > 0 ? tasksPayload.tasks : prev.tasks,
      users: usersPayload.users && usersPayload.users.length > 0 ? usersPayload.users : prev.users,
    }));
  };

  useEffect(() => {
    setState(loadInitialState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined' || !state.currentTenant) return;

    let cancelled = false;

    const run = async () => {
      try {
        const alreadySeeded = window.localStorage.getItem(DB_SEED_KEY) === '1';
        const hasLocalData = state.users.length > 0 || state.projects.length > 0 || state.tasks.length > 0;
        if (!alreadySeeded && hasLocalData) {
          await seedDatabaseFromSnapshot(state);
          if (!cancelled) {
            window.localStorage.setItem(DB_SEED_KEY, '1');
          }
        }
      } catch {
        // Fall back to local-only state when the backend is unavailable.
      }

      try {
        if (!cancelled) {
          await syncProjectsTasksUsersFromApi();
        }
      } catch {
        // Preserve local state if API sync is unavailable.
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, state.currentTenant?.id]);

  const logActivity = (actorName: string, type: ActivityEvent['type'], message: string) => {
    setState((prev) => ({
      ...prev,
      activity: [
        {
          id: uid('evt'),
          actorName,
          type,
          message,
          createdAt: new Date().toISOString(),
        },
        ...prev.activity,
      ],
    }));
  };

  const enqueueEmail = (to: string, subject: string, body: string) => {
    setState((prev) => ({
      ...prev,
      emailNotifications: [
        {
          id: uid('mail'),
          to,
          subject,
          body,
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
        ...prev.emailNotifications,
      ],
    }));
  };

  const signIn = (email: string, password: string) => {
    const savedPassword = state.credentials[email.toLowerCase()];
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!savedPassword || !user) {
      return { ok: false, message: 'Account not found. Complete onboarding or accept an invite first.' };
    }
    if (savedPassword !== password) {
      return { ok: false, message: 'Invalid password.' };
    }
    setState((prev) => ({ ...prev, isAuthenticated: true, currentUser: user }));
    logActivity(user.name, 'tenant_created', `${user.name} signed in.`);
    return { ok: true };
  };

  const signOut = () => {
    setState((prev) => ({ ...prev, isAuthenticated: false, currentUser: null }));
  };

  const completeOnboarding = ({ tenantName, workspaceName, name, email, password }: {
    tenantName: string;
    workspaceName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const now = new Date().toISOString();
    const tenantId = uid('tenant');
    const ownerId = uid('user');
    const workspace: Workspace = {
      id: uid('ws'),
      tenantId,
      name: workspaceName,
      createdAt: now,
    };
    const tenant: Tenant = {
      id: tenantId,
      name: tenantName,
      slug: slugify(tenantName),
      plan: 'free',
    };
    const owner: User = {
      id: ownerId,
      name,
      email,
      role: 'owner',
      avatarUrl: `https://picsum.photos/seed/${ownerId}/100/100`,
    };

    const starterProject: Project = {
      id: uid('project'),
      tenantId,
      name: 'Launch Plan',
      description: 'First collaborative project for your team.',
      status: 'active',
      progress: 12,
      ownerId,
      createdAt: now,
    };

    const starterTask: Task = {
      id: uid('task'),
      projectId: starterProject.id,
      title: 'Define MVP scope',
      description: 'List key modules and assign owners.',
      status: 'todo',
      priority: 'high',
      assigneeId: ownerId,
      dueDate: now.slice(0, 10),
      createdAt: now,
      createdBy: ownerId,
      subtasks: [
        { id: uid('sub'), title: 'List all target features', completed: false, createdAt: now },
        { id: uid('sub'), title: 'Prioritize core workflows', completed: false, createdAt: now },
      ],
      comments: [],
      tags: ['planning'],
      timeEntries: [],
      attachments: [],
    };

    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentUser: owner,
      currentTenant: tenant,
      currentWorkspace: workspace,
      users: [owner],
      projects: [starterProject],
      tasks: [starterTask],
      activity: [
        {
          id: uid('evt'),
          type: 'workspace_created',
          actorName: owner.name,
          message: `${owner.name} created workspace ${workspace.name}.`,
          createdAt: now,
        },
        {
          id: uid('evt'),
          type: 'tenant_created',
          actorName: owner.name,
          message: `${owner.name} created tenant ${tenant.name}.`,
          createdAt: now,
        },
      ],
      credentials: {
        [email.toLowerCase()]: password,
      },
      invitations: [],
      emailNotifications: [],
    }));

    void Promise.all([
      upsertUserToApi(owner, tenantId),
      postJson('/api/projects', starterProject),
      postJson('/api/tasks', starterTask),
    ]).catch(() => {
      // Local state remains the source of truth if infrastructure is not configured yet.
    });
  };

  const inviteUser = (email: string, role: UserRole) => {
    if (!state.currentUser) return;
    const invite: Invitation = {
      id: uid('invite'),
      email,
      role,
      status: 'pending',
      invitedBy: state.currentUser.id,
      invitedAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, invitations: [invite, ...prev.invitations] }));
    enqueueEmail(email, 'You are invited to Pinkplan', `You were invited as ${role}.`);
    logActivity(state.currentUser.name, 'invitation_sent', `${state.currentUser.name} invited ${email} as ${role}.`);
  };

  const acceptInvitation = (invitationId: string, payload: { name: string; password: string }) => {
    if (!state.currentTenant) return { ok: false, message: 'No tenant configured yet.' };
    const invitation = state.invitations.find((inv) => inv.id === invitationId && inv.status === 'pending');
    if (!invitation) return { ok: false, message: 'Invitation is invalid or already used.' };
    const now = new Date().toISOString();
    const user: User = {
      id: uid('user'),
      name: payload.name,
      email: invitation.email,
      role: invitation.role,
      avatarUrl: `https://picsum.photos/seed/${payload.name}/100/100`,
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, user],
      invitations: prev.invitations.map((inv) => (inv.id === invitationId ? { ...inv, status: 'accepted' } : inv)),
      credentials: {
        ...prev.credentials,
        [user.email.toLowerCase()]: payload.password,
      },
      activity: [
        {
          id: uid('evt'),
          type: 'invitation_accepted',
          actorName: user.name,
          message: `${user.name} joined the workspace as ${user.role}.`,
          createdAt: now,
        },
        ...prev.activity,
      ],
    }));

    void upsertUserToApi(user, state.currentTenant.id).catch(() => {
      // Keep local invite acceptance functional even without the backend.
    });
    return { ok: true };
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    }));
    const changed = state.users.find((u) => u.id === userId);
    if (changed) {
      logActivity(state.currentUser.name, 'role_updated', `${changed.name} is now ${role}.`);
      if (state.currentTenant) {
        void upsertUserToApi({ ...changed, role }, state.currentTenant.id).catch(() => {
          // Ignore backend sync failures here.
        });
      }
    }
  };

  const addProject = (p: Omit<Project, 'id' | 'createdAt' | 'tenantId'>) => {
    if (!state.currentTenant || !state.currentUser) return;
    const newProject: Project = {
      ...p,
      id: uid('project'),
      tenantId: state.currentTenant.id,
      createdAt: new Date().toISOString()
    };
    setState((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
    logActivity(state.currentUser.name, 'project_created', `${state.currentUser.name} created project ${newProject.name}.`);
    void postJson('/api/projects', newProject).catch(() => {
      // Local optimistic state already applied.
    });
  };

  const updateProject = (projectId: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status' | 'progress'>>) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
    }));
    logActivity(state.currentUser.name, 'project_updated', `${state.currentUser.name} updated project settings.`);
    void postJson(`/api/projects/${projectId}`, updates, 'PATCH').catch(() => {
      // Local optimistic state already applied.
    });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
    logActivity(state.currentUser.name, 'task_status_changed', `${state.currentUser.name} moved a task to ${status}.`);
    void postJson(`/api/tasks/${taskId}`, { status }, 'PATCH').catch(() => {
      // Local optimistic state already applied.
    });
  };

  const addTask = (t: Omit<Task, 'id' | 'createdAt' | 'comments' | 'subtasks' | 'createdBy' | 'tags' | 'timeEntries' | 'attachments'>) => {
    if (!state.currentUser) return;
    const newTask: Task = {
      ...t,
      id: uid('task'),
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser.id,
      subtasks: [],
      comments: [],
      tags: [],
      timeEntries: [],
      attachments: [],
    };
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    logActivity(state.currentUser.name, 'task_created', `${state.currentUser.name} created task ${newTask.title}.`);
    void postJson('/api/tasks', newTask).catch(() => {
      // Local optimistic state already applied.
    });
  };

  const assignTask = (taskId: string, assigneeId: string) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, assigneeId } : t)),
    }));
    const assignee = state.users.find((u) => u.id === assigneeId);
    if (assignee) {
      enqueueEmail(assignee.email, 'Task assigned to you', `A task has been assigned to ${assignee.name}.`);
      logActivity(state.currentUser.name, 'task_assigned', `${state.currentUser.name} assigned a task to ${assignee.name}.`);
    }
    void postJson(`/api/tasks/${taskId}`, { assigneeId }, 'PATCH').catch(() => {
      // Local optimistic state already applied.
    });
  };

  const setTaskDueDate = (taskId: string, dueDate?: string) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate } : t)),
    }));
    logActivity(state.currentUser.name, 'task_due_date_set', `${state.currentUser.name} updated a task due date.`);
    void postJson(`/api/tasks/${taskId}`, { dueDate: dueDate ?? null }, 'PATCH').catch(() => {
      // Local optimistic state already applied.
    });
  };

  const addSubtask = (taskId: string, title: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...t.subtasks, { id: uid('sub'), title, completed: false, createdAt: new Date().toISOString() }],
            }
          : t
      ),
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
            }
          : t
      ),
    }));
  };

  const addComment = (taskId: string, content: string) => {
    if (!state.currentUser) return;
    const newComment: Comment = {
      id: uid('comment'),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userAvatar: state.currentUser.avatarUrl,
      content,
      createdAt: new Date().toISOString()
    };
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t)),
    }));
    logActivity(state.currentUser.name, 'comment_added', `${state.currentUser.name} commented on a task.`);
  };

  // ── Phase 2: Milestones ─────────────────────────────────────────────────────
  const addMilestone = (m: Omit<Milestone, 'id' | 'createdAt'>) => {
    if (!state.currentUser) return;
    const milestone: Milestone = { ...m, id: uid('ms'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, milestones: [...prev.milestones, milestone] }));
    logActivity(state.currentUser.name, 'milestone_created', `${state.currentUser.name} created milestone "${milestone.title}".`);
    logAudit('milestone.create', 'Milestone', milestone.id, `Created milestone "${milestone.title}"`);
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Pick<Milestone, 'title' | 'description' | 'dueDate' | 'status'>>) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === milestoneId ? { ...m, ...updates } : m)),
    }));
    if (updates.status === 'completed') {
      const m = state.milestones.find((x) => x.id === milestoneId);
      if (m) logActivity(state.currentUser!.name, 'milestone_completed', `${state.currentUser!.name} completed milestone "${m.title}".`);
    }
  };

  const deleteMilestone = (milestoneId: string) => {
    setState((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== milestoneId) }));
    logAudit('milestone.delete', 'Milestone', milestoneId, 'Deleted milestone');
  };

  // ── Phase 2: Time Tracking ──────────────────────────────────────────────────
  const addTimeEntry = (taskId: string, entry: Omit<TimeEntry, 'id' | 'taskId' | 'userId' | 'userName' | 'loggedAt'>) => {
    if (!state.currentUser) return;
    const newEntry: TimeEntry = {
      ...entry,
      id: uid('te'),
      taskId,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      loggedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, timeEntries: [...(t.timeEntries ?? []), newEntry] } : t)),
    }));
    logActivity(state.currentUser.name, 'time_logged', `${state.currentUser.name} logged ${entry.minutes}m on a task.`);
    logAudit('time.log', 'Task', taskId, `Logged ${entry.minutes} minutes`);
  };

  const deleteTimeEntry = (taskId: string, entryId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, timeEntries: (t.timeEntries ?? []).filter((e) => e.id !== entryId) } : t
      ),
    }));
  };

  // ── Phase 2: File Attachments ───────────────────────────────────────────────
  const addAttachment = (taskId: string, attachment: Omit<FileAttachment, 'id' | 'taskId' | 'uploadedBy' | 'uploadedAt'>) => {
    if (!state.currentUser) return;
    const newAttachment: FileAttachment = {
      ...attachment,
      id: uid('att'),
      taskId,
      uploadedBy: state.currentUser.name,
      uploadedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, attachments: [...(t.attachments ?? []), newAttachment] } : t
      ),
    }));
    logActivity(state.currentUser.name, 'attachment_added', `${state.currentUser.name} attached "${attachment.name}".`);
    logAudit('attachment.upload', 'Task', taskId, `Uploaded file "${attachment.name}"`);
  };

  const removeAttachment = (taskId: string, attachmentId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, attachments: (t.attachments ?? []).filter((a) => a.id !== attachmentId) } : t
      ),
    }));
    logAudit('attachment.delete', 'Task', taskId, 'Removed attachment');
  };

  // ── Phase 2: Templates ──────────────────────────────────────────────────────
  const addTemplate = (t: Omit<ProjectTemplate, 'id' | 'createdAt' | 'isDefault'>) => {
    if (!state.currentUser) return;
    const template: ProjectTemplate = { ...t, id: uid('tpl'), createdAt: new Date().toISOString(), isDefault: false };
    setState((prev) => ({ ...prev, templates: [...prev.templates, template] }));
    logAudit('template.create', 'Template', template.id, `Created template "${template.name}"`);
  };

  const deleteTemplate = (templateId: string) => {
    setState((prev) => ({ ...prev, templates: prev.templates.filter((t) => t.id !== templateId) }));
    logAudit('template.delete', 'Template', templateId, 'Deleted template');
  };

  const createProjectFromTemplate = (templateId: string, projectName: string, projectDescription: string) => {
    if (!state.currentTenant || !state.currentUser) return;
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) return;
    const now = new Date().toISOString();
    const newProject: Project = {
      id: uid('project'),
      tenantId: state.currentTenant.id,
      name: projectName,
      description: projectDescription,
      status: 'active',
      progress: 0,
      ownerId: state.currentUser.id,
      createdAt: now,
      templateId,
      color: template.color,
    };
    const newTasks: Task[] = template.defaultTasks.map((dt) => ({
      id: uid('task'),
      projectId: newProject.id,
      title: dt.title,
      description: dt.description,
      status: dt.status,
      priority: dt.priority,
      createdAt: now,
      createdBy: state.currentUser!.id,
      subtasks: [],
      comments: [],
      tags: [],
      timeEntries: [],
      attachments: [],
    }));
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
      tasks: [...prev.tasks, ...newTasks],
    }));
    logActivity(state.currentUser.name, 'template_used', `${state.currentUser.name} created project "${newProject.name}" from template "${template.name}".`);
    logActivity(state.currentUser.name, 'project_created', `${state.currentUser.name} created project ${newProject.name}.`);
    logAudit('project.from_template', 'Project', newProject.id, `Created from template "${template.name}"`);
  };

  // ── Phase 2: Webhooks ───────────────────────────────────────────────────────
  const addWebhook = (w: Omit<WebhookConfig, 'id' | 'createdAt'>) => {
    if (!state.currentUser) return;
    const webhook: WebhookConfig = { ...w, id: uid('wh'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, webhooks: [...prev.webhooks, webhook] }));
    logAudit('webhook.create', 'Webhook', webhook.id, `Created webhook "${webhook.name}"`);
  };

  const updateWebhook = (webhookId: string, updates: Partial<Pick<WebhookConfig, 'name' | 'url' | 'events' | 'active'>>) => {
    setState((prev) => ({
      ...prev,
      webhooks: prev.webhooks.map((w) => (w.id === webhookId ? { ...w, ...updates } : w)),
    }));
    logAudit('webhook.update', 'Webhook', webhookId, 'Updated webhook config');
  };

  const deleteWebhook = (webhookId: string) => {
    setState((prev) => ({ ...prev, webhooks: prev.webhooks.filter((w) => w.id !== webhookId) }));
    logAudit('webhook.delete', 'Webhook', webhookId, 'Deleted webhook');
  };

  // ── Phase 2: Internal audit logger ─────────────────────────────────────────
  const logAudit = (action: string, resource: string, resourceId: string, details: string) => {
    if (!state.currentUser) return;
    const entry: AuditLogEntry = {
      id: uid('audit'),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      actorEmail: state.currentUser.email,
      action,
      resource,
      resourceId,
      details,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, auditLog: [entry, ...prev.auditLog] }));
  };

  // ── Phase 3: Enterprise + Scale ───────────────────────────────────────────
  const configureSso = (config: Omit<SsoConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const next: SsoConfig = {
      id: state.ssoConfig?.id ?? uid('sso'),
      createdAt: state.ssoConfig?.createdAt ?? now,
      updatedAt: now,
      ...config,
    };
    setState((prev) => ({ ...prev, ssoConfig: next }));
    logActivity(state.currentUser.name, 'sso_configured', `${state.currentUser.name} updated SSO settings.`);
    logAudit('sso.configure', 'SSO', next.id, `Configured ${next.provider} SSO for ${next.domain}`);
  };

  const configureScim = (config: Omit<ScimConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const next: ScimConfig = {
      id: state.scimConfig?.id ?? uid('scim'),
      createdAt: state.scimConfig?.createdAt ?? now,
      updatedAt: now,
      ...config,
    };
    setState((prev) => ({ ...prev, scimConfig: next }));
    logAudit('scim.configure', 'SCIM', next.id, `Configured SCIM endpoint ${next.endpoint}`);
  };

  const syncScim = () => {
    if (!state.currentUser || !state.scimConfig) return;
    const now = new Date().toISOString();
    const usersProvisioned = state.scimConfig.usersProvisioned + Math.floor(Math.random() * 4);
    const groupsProvisioned = state.scimConfig.groupsProvisioned + Math.floor(Math.random() * 2);
    setState((prev) => ({
      ...prev,
      scimConfig: prev.scimConfig
        ? { ...prev.scimConfig, lastSyncAt: now, updatedAt: now, usersProvisioned, groupsProvisioned }
        : prev.scimConfig,
    }));
    logActivity(state.currentUser.name, 'scim_synced', `${state.currentUser.name} ran a SCIM sync.`);
    logAudit('scim.sync', 'SCIM', state.scimConfig.id, 'Executed manual SCIM sync');
  };

  const addCustomRole = (role: Omit<CustomRole, 'id' | 'createdAt' | 'system'>) => {
    if (!state.currentUser) return;
    const nextRole: CustomRole = {
      ...role,
      id: uid('role'),
      system: false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, customRoles: [...prev.customRoles, nextRole] }));
    logActivity(state.currentUser.name, 'role_created', `${state.currentUser.name} created role ${nextRole.name}.`);
    logAudit('role.create', 'Role', nextRole.id, `Created role ${nextRole.name}`);
  };

  const deleteCustomRole = (roleId: string) => {
    setState((prev) => ({ ...prev, customRoles: prev.customRoles.filter((r) => r.id !== roleId || r.system) }));
    logAudit('role.delete', 'Role', roleId, 'Deleted custom role');
  };

  const addDepartment = (department: Omit<Department, 'id' | 'createdAt'>) => {
    const nextDepartment: Department = { ...department, id: uid('dep'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, departments: [...prev.departments, nextDepartment] }));
    logAudit('department.create', 'Department', nextDepartment.id, `Created department ${nextDepartment.name}`);
  };

  const assignUserDepartment = (userId: string, departmentId?: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, departmentId } : u)),
    }));
    logAudit('department.assign', 'User', userId, `Assigned department ${departmentId ?? 'none'}`);
  };

  const addAutomation = (automation: Omit<WorkflowAutomation, 'id' | 'createdAt' | 'runCount' | 'lastRunAt'>) => {
    const next: WorkflowAutomation = {
      ...automation,
      id: uid('auto'),
      runCount: 0,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, automations: [...prev.automations, next] }));
    logAudit('automation.create', 'Automation', next.id, `Created automation ${next.name}`);
  };

  const runAutomation = (automationId: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      automations: prev.automations.map((a) => (a.id === automationId ? { ...a, runCount: a.runCount + 1, lastRunAt: now } : a)),
    }));
    logActivity(state.currentUser.name, 'automation_run', `${state.currentUser.name} triggered an automation.`);
    logAudit('automation.run', 'Automation', automationId, 'Ran automation manually');
  };

  const addPortfolio = (portfolio: Omit<Portfolio, 'id' | 'createdAt'>) => {
    const next: Portfolio = { ...portfolio, id: uid('port'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, portfolios: [...prev.portfolios, next] }));
    logAudit('portfolio.create', 'Portfolio', next.id, `Created portfolio ${next.name}`);
  };

  const addRegion = (region: Omit<RegionConfig, 'id' | 'createdAt'>) => {
    const next: RegionConfig = { ...region, id: uid('reg'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, regions: [...prev.regions, next] }));
    logAudit('region.add', 'Region', next.id, `Added region ${next.code}`);
  };

  const toggleRegion = (regionId: string, active: boolean) => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      regions: prev.regions.map((r) => (r.id === regionId ? { ...r, active } : r)),
    }));
    logActivity(state.currentUser.name, 'region_changed', `${state.currentUser.name} ${active ? 'enabled' : 'disabled'} a region.`);
    logAudit('region.toggle', 'Region', regionId, `Region active=${active}`);
  };

  const refreshEventStats = () => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      eventStats: prev.eventStats.map((s) => ({
        ...s,
        throughputPerMin: Math.max(100, Math.round(s.throughputPerMin * (0.9 + Math.random() * 0.25))),
        errorRatePct: Math.max(0, +(s.errorRatePct + (Math.random() * 0.3 - 0.15)).toFixed(2)),
        lagMs: Math.max(10, Math.round(s.lagMs * (0.8 + Math.random() * 0.4))),
        updatedAt: now,
      })),
    }));
  };

  const addComplianceControl = (control: ComplianceControl) => {
    setState((prev) => ({ ...prev, complianceControls: [...prev.complianceControls, control] }));
  };

  const runComplianceCheck = () => {
    if (!state.currentUser) return;
    setState((prev) => ({
      ...prev,
      complianceControls: prev.complianceControls.map((c) => {
        const rand = Math.random();
        const status = rand > 0.94 ? 'fail' : rand > 0.78 ? 'warn' : 'pass';
        return { ...c, status, evidenceCount: c.evidenceCount + (status === 'pass' ? 1 : 0) };
      }),
    }));
    logActivity(state.currentUser.name, 'compliance_checked', `${state.currentUser.name} ran a compliance check.`);
    logAudit('compliance.check', 'Compliance', 'all', 'Executed compliance check across controls');
  };

  const addAnalyticsView = (view: Omit<AnalyticsView, 'id' | 'createdAt'>) => {
    const next: AnalyticsView = { ...view, id: uid('view'), createdAt: new Date().toISOString() };
    setState((prev) => ({ ...prev, analyticsViews: [...prev.analyticsViews, next] }));
  };

  const addWarehouseExport = (job: Omit<WarehouseExportJob, 'id' | 'createdAt' | 'status' | 'lastRunAt' | 'rowCount'>) => {
    const next: WarehouseExportJob = {
      ...job,
      id: uid('whx'),
      createdAt: new Date().toISOString(),
      status: 'idle',
      rowCount: 0,
    };
    setState((prev) => ({ ...prev, warehouseExports: [...prev.warehouseExports, next] }));
  };

  const runWarehouseExport = (jobId: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      warehouseExports: prev.warehouseExports.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'success',
              lastRunAt: now,
              rowCount: Math.max(1000, Math.round((j.rowCount || 5000) * (1.1 + Math.random() * 0.4))),
            }
          : j
      ),
    }));
    logActivity(state.currentUser.name, 'warehouse_exported', `${state.currentUser.name} ran a warehouse export.`);
    logAudit('warehouse.export', 'WarehouseExport', jobId, 'Executed export job');
  };

  // -- Phase 4: Intelligence -------------------------------------------------
  const setWorkspaceAiSummary = (summary: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      workspaceAiSummary: summary,
      workspaceAiSummaryUpdatedAt: now,
    }));
    logActivity(state.currentUser.name, 'ai_summary_generated', `${state.currentUser.name} generated an AI workspace summary.`);
    logAudit('ai.summary', 'Workspace', state.currentWorkspace?.id ?? 'workspace', 'Generated AI summary');
  };

  const refreshRecommendations = () => {
    if (!state.currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const recommendations = state.tasks
      .filter((t) => t.status !== 'done')
      .map((task) => {
        const overdue = task.dueDate ? task.dueDate < today : false;
        const dueSoon = task.dueDate ? task.dueDate <= new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10) : false;
        const noAssignee = !task.assigneeId;
        const impactScore = (overdue ? 45 : 0) + (task.priority === 'urgent' ? 30 : task.priority === 'high' ? 20 : 10) + (dueSoon ? 15 : 0) + (noAssignee ? 10 : 0);
        const reasonParts = [
          overdue ? 'Task is overdue' : dueSoon ? 'Task is due soon' : 'Task has no near due date',
          noAssignee ? 'no assignee' : 'has assignee',
        ];
        return {
          id: uid('rec'),
          title: `Review task: ${task.title}`,
          reason: reasonParts.join(', '),
          impactScore,
          taskId: task.id,
          projectId: task.projectId,
          createdAt: new Date().toISOString(),
        };
      })
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 8);

    setState((prev) => ({ ...prev, recommendations }));
    logActivity(state.currentUser.name, 'recommendations_refreshed', `${state.currentUser.name} refreshed smart recommendations.`);
    logAudit('ai.recommendations', 'Workspace', state.currentWorkspace?.id ?? 'workspace', `Generated ${recommendations.length} recommendations`);
  };

  const refreshRiskAlerts = () => {
    if (!state.currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const alerts: DeliveryRiskAlert[] = state.projects.map((project) => {
      const scoped = state.tasks.filter((t) => t.projectId === project.id);
      const open = scoped.filter((t) => t.status !== 'done');
      const overdue = open.filter((t) => t.dueDate && t.dueDate < today).length;
      const urgentOpen = open.filter((t) => t.priority === 'urgent').length;
      const completion = scoped.length > 0 ? scoped.filter((t) => t.status === 'done').length / scoped.length : 0;
      const base = open.length > 0 ? (overdue / open.length) * 55 + (urgentOpen / open.length) * 30 : 0;
      const progressPenalty = completion < 0.35 ? 20 : completion < 0.55 ? 10 : 0;
      const riskScore = Math.max(0, Math.min(100, Math.round(base + progressPenalty)));
      const severity: DeliveryRiskAlert['severity'] = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
      const drivers = [
        `${overdue} overdue open tasks`,
        `${urgentOpen} urgent open tasks`,
        `${Math.round(completion * 100)}% completed`,
      ];
      return {
        id: uid('risk'),
        projectId: project.id,
        projectName: project.name,
        riskScore,
        severity,
        drivers,
        createdAt: new Date().toISOString(),
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    setState((prev) => ({ ...prev, riskAlerts: alerts }));
    logActivity(state.currentUser.name, 'risk_alert_generated', `${state.currentUser.name} ran predictive risk analysis.`);
    logAudit('ai.risk', 'Workspace', state.currentWorkspace?.id ?? 'workspace', `Generated ${alerts.length} risk alerts`);
  };

  const saveNlReport = (query: string, answer: string) => {
    if (!state.currentUser) return;
    const report: NaturalLanguageReport = {
      id: uid('nlr'),
      query,
      answer,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, nlReports: [report, ...prev.nlReports].slice(0, 30) }));
    logActivity(state.currentUser.name, 'nl_report_generated', `${state.currentUser.name} generated a natural language report.`);
    logAudit('ai.report', 'Workspace', state.currentWorkspace?.id ?? 'workspace', `Created NL report: ${query}`);
  };

  const runIntelligentPrioritization = () => {
    if (!state.currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const changes: IntelligentPriorityResult[] = [];

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.status === 'done') return task;
        const overdue = task.dueDate ? task.dueDate < today : false;
        const dueSoon = task.dueDate ? task.dueDate <= new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10) : false;
        let nextPriority = task.priority;
        let reason = '';
        if (overdue && task.priority !== 'urgent') {
          nextPriority = 'urgent';
          reason = 'Overdue task escalated to urgent';
        } else if (dueSoon && (task.priority === 'low' || task.priority === 'medium')) {
          nextPriority = 'high';
          reason = 'Upcoming due date escalated priority';
        }
        if (nextPriority !== task.priority) {
          changes.push({
            id: uid('prio'),
            taskId: task.id,
            taskTitle: task.title,
            fromPriority: task.priority,
            toPriority: nextPriority,
            reason,
            createdAt: now,
          });
          return { ...task, priority: nextPriority };
        }
        return task;
      }),
      priorityChanges: [...changes, ...prev.priorityChanges].slice(0, 100),
    }));

    logActivity(state.currentUser.name, 'tasks_reprioritized', `${state.currentUser.name} ran intelligent prioritization on ${changes.length} tasks.`);
    logAudit('ai.prioritize', 'Task', 'bulk', `Reprioritized ${changes.length} tasks`);
  };

  const canManageMembers = state.currentUser?.role === 'owner' || state.currentUser?.role === 'admin';
  const canManageProjects = state.currentUser?.role === 'owner' || state.currentUser?.role === 'admin';

  const contextValue = useMemo<AppState>(() => ({
    isHydrated,
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser,
    currentTenant: state.currentTenant,
    currentWorkspace: state.currentWorkspace,
    projects: state.projects,
    tasks: state.tasks,
    users: state.users,
    invitations: state.invitations,
    emailNotifications: state.emailNotifications,
    activity: state.activity,
    signIn,
    signOut,
    completeOnboarding,
    inviteUser,
    acceptInvitation,
    updateUserRole,
    addProject,
    updateProject,
    updateTaskStatus,
    addTask,
    assignTask,
    setTaskDueDate,
    addSubtask,
    toggleSubtask,
    addComment,
    milestones: state.milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addTimeEntry,
    deleteTimeEntry,
    addAttachment,
    removeAttachment,
    templates: state.templates,
    addTemplate,
    deleteTemplate,
    createProjectFromTemplate,
    webhooks: state.webhooks,
    addWebhook,
    updateWebhook,
    deleteWebhook,
    auditLog: state.auditLog,
    ssoConfig: state.ssoConfig,
    scimConfig: state.scimConfig,
    customRoles: state.customRoles,
    automations: state.automations,
    portfolios: state.portfolios,
    departments: state.departments,
    regions: state.regions,
    eventStats: state.eventStats,
    complianceControls: state.complianceControls,
    analyticsViews: state.analyticsViews,
    warehouseExports: state.warehouseExports,
    configureSso,
    configureScim,
    syncScim,
    addCustomRole,
    deleteCustomRole,
    assignUserDepartment,
    addDepartment,
    addAutomation,
    runAutomation,
    addPortfolio,
    addRegion,
    toggleRegion,
    refreshEventStats,
    addComplianceControl,
    runComplianceCheck,
    addAnalyticsView,
    runWarehouseExport,
    addWarehouseExport,
    workspaceAiSummary: state.workspaceAiSummary,
    workspaceAiSummaryUpdatedAt: state.workspaceAiSummaryUpdatedAt,
    recommendations: state.recommendations,
    riskAlerts: state.riskAlerts,
    nlReports: state.nlReports,
    priorityChanges: state.priorityChanges,
    setWorkspaceAiSummary,
    refreshRecommendations,
    refreshRiskAlerts,
    saveNlReport,
    runIntelligentPrioritization,
    canManageMembers,
    canManageProjects,
  }), [isHydrated, state]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
