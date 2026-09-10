# Technical Interview Masterclass Guide — UniversiTea

Comprehensive system design, security, and backend engineering discussion scenarios based on the implemented codebase.

---

## 1. Product Model & Access Control

### Q: What is the access control model for UniversiTea?
**Discussion:** UniversiTea is a public platform where guests can freely browse communities (`/r/cec`), posts, comments, verification badges, and approved proof receipts. Participation (posting, commenting, voting, submitting receipts, reporting) requires a registered UniversiTea account. Crucially, there is NO college verification or `@college.edu` domain restriction — anyone with a registered account can participate anonymously.

---

## 2. Cryptography & Anonymous Identity

### Q: How do you prevent users from being tracked across different posts?
**Discussion:** Instead of assigning a global anonymous handle, we use a thread-scoped persona derivation function (`selectPersonaForThread` in `lib/identity/generator.ts`). It computes a SHA-256 HMAC of `(userId + threadId)`. This guarantees that within a single thread, Student A is always "Anonymous Panda 🐼", but in another thread, Student A becomes "Anonymous Owl 🦉".

---

## 3. Truth & Verification Engine

### Q: How does UniversiTea handle rumor verification without relying on crowd upvotes?
**Discussion:** Popularity is not proof. Upvotes only reflect community interest. Verification is handled by an evidence engine (`lib/verification/verificationService.ts`). Users submit receipts (links, documents, screenshots). The system parses domain credibility and moderators review receipts to update post status (`VERIFIED`, `DISPUTED`, `UNVERIFIED`).

---

## 4. AI Safety & Moderation Pipeline

### Q: Why didn't you let AI automatically ban users or verify posts?
**Discussion:** AI models hallucinate and exhibit bias. We implemented AI as an advisory assistant (`lib/ai/pipeline.ts`). The AI classifies content (threats, harassment, spam, PII, allegations) and assigns a risk level (`LOW` to `CRITICAL`). Items flagged as high risk are routed to the human moderation queue (`/api/admin/moderation/queue`). Human moderators retain 100% execution authority for bans and verification.
