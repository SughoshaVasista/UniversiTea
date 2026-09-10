# UniversiTea — Technical Architecture Specification

## Overview & Master Product Model

UniversiTea is a Reddit-style anonymous social platform for campus communities.

- **Public Browsing:** Guests can view communities, posts, comments, verification badges, and approved receipts.
- **Registered Participation:** Creating posts, commenting, voting, submitting receipts, and reporting requires a registered UniversiTea account.
- **No College Verification:** Institutional email addresses (@college.edu) and student ID verification are not required for account creation or participation.

```
                  ┌─────────────────────────────────────┐
                  │           Client Browser            │
                  │     (Next.js React / PWA Client)    │
                  └──────────────────┬──────────────────┘
                                     │ HTTPS / WebSockets
                                     ▼
                  ┌─────────────────────────────────────┐
                  │         Next.js App Router          │
                  │    (API Routes + Server Views)      │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Auth & Identity   │    │ Verification Engine│    │ AI Safety Pipeline │
│ (HMAC / NextAuth)  │    │  (Claims/Receipts) │    │(Provider Factory)  │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │        PostgreSQL Database          │
                  │    (Prisma ORM with Multi-Tenant)   │
                  └─────────────────────────────────────┘
```

## Security & User Roles

1. **GUEST:** Public read-only access (`GET /r/cec`, `GET /r/cec/post/[postId]`). Participation returns `401 Unauthorized`.
2. **REGISTERED USER:** Authenticated account (`userId`). Public participation is masked using thread-scoped anonymous identities (`Anonymous Panda 🐼`).
3. **MODERATOR / ADMIN:** Role-based access control (`MODERATOR`, `COMMUNITY_ADMIN`, `SUPER_ADMIN`) scoped per community.
