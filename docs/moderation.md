# Moderation & Content Safety Specification

## Roles & Responsibilities

- **USER:** Create posts, comment, vote, submit receipts, file reports.
- **MODERATOR:** Review community reports, audit receipt evidence, update verification statuses in their assigned community.
- **COMMUNITY_ADMIN:** Manage community settings, guidelines, and moderator assignments.
- **SUPER_ADMIN:** Platform-wide health monitoring, community creation approval, and global audit logging.

## Moderation Workflow

1. **User Reporting / AI Flagging:** Posts or comments flagged for threats, harassment, spam, PII, or targeted allegations enter the moderation queue (`/api/admin/moderation/queue`).
2. **Review:** Moderators evaluate reported items without seeing real user emails or identity mappings.
3. **Action & Audit:** Resolutions (`ALLOW`, `HIDE`, `WARN`, `SUSPEND`) are logged in `ModerationAction` for auditing.
