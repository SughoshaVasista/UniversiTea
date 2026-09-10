# Technical Interview Preparation Guide — UniversiTea

## Architecture & System Design Questions

### Q1: How does UniversiTea ensure anonymity while preventing cross-thread user tracking?
**Answer:** UniversiTea uses a deterministic contextual persona generator in `lib/identity/generator.ts`. By hashing `(userId + threadId)` using SHA-256 HMAC, the system generates a thread-unique avatar and handle (e.g. `Anonymous Panda 🐼`). Within the same post thread, the user retains their persona, but across different posts, the generated identity shifts completely.

### Q2: How does the system handle AI safety without giving AI autonomous ban power?
**Answer:** The AI provider interface in `lib/ai/` acts strictly as an advisory assistant. All AI classifications (threat, harassment, spam, PII, targeted allegation) emit risk level signals (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) that queue content for human moderator review (`/api/admin/moderation/queue`). The AI is schema-constrained and cannot directly change verification states or apply account bans.

### Q3: How is multi-tenant isolation enforced for college communities?
**Answer:** Every database model in `prisma/schema.prisma` is scoped to a `communityId`. API routes resolve community membership server-side from session tokens rather than trusting client-provided body parameters. Unit tests in `tests/tenant-isolation.test.ts` verify cross-tenant access rejections.

### Q4: How is database state protected against race conditions during high-volume voting?
**Answer:** Vote operations are handled atomically in `lib/post/postService.ts` using Prisma upsert and transactional counter increments (`increment: 1` / `decrement: 1`), preventing race conditions during concurrent voting bursts.
