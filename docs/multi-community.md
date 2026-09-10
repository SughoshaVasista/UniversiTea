# Multi-Community Architecture & Self-Serve Onboarding Specification

## Topology & Tenant Isolation

UniversiTea operates as a multi-tenant platform serving isolated campus rooms through a single unified codebase and database:

```
UniversiTea Platform
 ├── /r/cec    (City Engineering College)
 ├── /r/rvce   (RV College of Engineering)
 └── /r/bmsce  (BMS College of Engineering)
```

## Access Control & Boundary Rules

1. **Public Browsing:** Guests can view communities, posts, comments, and receipts.
2. **Registered Participation:** Any registered UniversiTea account can join and participate anonymously. College verification is NOT required.
3. **Reserved Slugs:** Reserved system slugs (`admin`, `api`, `login`, `signup`, `communities`, `search`, `create-community`) cannot be registered as community slugs (`lib/community/slugs.ts`).
4. **RBAC Scoping:**
   - **Community Moderators:** Can moderate content ONLY within their assigned `communityId`.
   - **Community Admins:** Can customize rules, categories, and settings ONLY within their assigned `communityId`.
   - **Super Admin:** Platform-wide oversight.
