# Database Design

This document captures the intended PostgreSQL core schema and operational guidance for Pinkplan.

## Core Entities

Implemented in Prisma schema:

- tenants
- workspaces
- users
- user_tenants
- roles
- permissions
- role_permissions
- projects
- project_members
- milestones
- tasks
- task_assignees
- task_dependencies
- task_comments
- task_checklists
- task_labels
- task_label_assignments
- time_entries
- files
- notifications
- activity_logs
- audit_logs
- subscriptions
- invoices
- plans
- webhooks
- integrations

## Design Notes

- Prisma field mappings preserve existing TypeScript-friendly names while storing snake_case columns in PostgreSQL.
- `tenant_id + business key` indexes are added on high-traffic tables for multi-tenant filtering.
- Soft delete support is modeled with `deleted_at` on recovery-sensitive entities.
- Existing app-compatible fields such as task JSON tags, attachments, and time entry mirrors are preserved during migration.

## Operational Best Practices

These are recommended at the database/infrastructure layer rather than directly represented in Prisma:

- Partition `activity_logs`, `audit_logs`, and `notifications` by time at higher scale.
- Use read replicas for reporting and analytics workloads.
- Place Redis in front of hot read paths such as project lists, user lists, and task lists.
- Add tenant-aware query guards in the API layer for every read and write path.
- Prefer background jobs for invoice syncs, webhook delivery retries, and notification fan-out.
