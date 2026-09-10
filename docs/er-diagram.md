# Database Entity-Relationship (ER) Documentation

```
[Community] 1 ──── N [Post] 1 ──── N [Comment]
     │                 │                │
     │                 │                └── N [Vote]
     │                 ├── N [Receipt]
     │                 ├── N [VerificationHistory]
     │                 └── N [Claim]
     │
     └── 1 ──── N [AnonymousIdentity]
     └── 1 ──── N [Report]
     └── 1 ──── N [CommunityMembership] ──── N [User]
```

## Core Entities
- **Community:** College room container (`slug`, `emailDomain`, `status`).
- **User:** Account representation (`emailHash`, `hashedPassword`, `role`, `accountStatus`).
- **AnonymousIdentity:** Thread persona map (`userId`, `communityId`, `threadId`, `name`, `avatar`).
- **Post / Comment / Vote:** Core interaction entities with composite indexing.
- **Receipt & Claim:** Evidence-backed verification entities.
