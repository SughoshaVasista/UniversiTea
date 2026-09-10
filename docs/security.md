# Security & Threat Model Specification

## 1. Threat Model & Guarantees

UniversiTea protects user anonymity while holding content accountable through server-side verification:

- **Public Anonymity:** User IDs, emails, IP addresses, and database primary keys are NEVER sent to the client.
- **Backend Accountability:** One-way SHA-256 HMAC hashed user references allow moderators to act against abuse without knowing real identities.
- **No College Verification Required:** Anyone can register a UniversiTea account. Authentication proves account ownership, not student attendance.

## 2. User Permission Matrix

| User Type | Public Browsing | Create Post / Comment | Vote / Submit Receipts | Admin / Moderation |
| :--- | :---: | :---: | :---: | :---: |
| **GUEST** | ✅ Allowed | ❌ 401 Unauthorized | ❌ 401 Unauthorized | ❌ 401 Unauthorized |
| **REGISTERED USER** | ✅ Allowed | ✅ Allowed (Anonymous) | ✅ Allowed | ❌ 403 Forbidden |
| **MODERATOR** | ✅ Allowed | ✅ Allowed (Anonymous) | ✅ Allowed | ✅ Allowed (Community Scoped) |
| **SUPER ADMIN** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed (Platform Wide) |

## 3. Threat Mitigations

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **XSS** | Input sanitization, CSP headers, React HTML escaping |
| **CSRF** | SameSite cookies, NextAuth state tokens |
| **SSRF** | Whitelisted URL parsing, private IP range blocking (`127.0.0.1`, `10.0.0.0/8`, metadata endpoints) |
| **IDOR** | Server-side `userId` & `communityId` session validation on every route |
