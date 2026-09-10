# Senior Engineering Portfolio Showcase — UniversiTea

## System Highlights & Metrics

UniversiTea is a Reddit-style anonymous social network for campus communities built with **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**.

```
Architecture Summary:
- Access Control: Public browsing, registered-user participation, zero college verification
- Multi-Tenant Engine: Isolation across /r/cec, /r/rvce, /r/bmsce
- Privacy Layer: One-Way SHA-256 HMAC email hashing & thread persona generator
- Verification Engine: Receipt corroboration & proof source evaluation
- AI Safety Pipeline: Advisory risk-level queueing (Mock / Gemini / OpenAI)
- Automated Test Suite: 16 test suites, 86+ tests passing, 0 TypeScript errors
```

## Key Implemented Accomplishments

1. **Public Browsing & Registered Participation:** Implemented a guest-friendly public view for campus tea rooms while requiring a registered UniversiTea account for posting, commenting, voting, and submitting receipts.
2. **Contextual Persona Generator:** Solved global user tracking by deriving deterministic SHA-256 HMAC personas per `(userId + threadId)`. Users maintain consistent identities in a thread but remain uncorrelated across threads.
3. **Evidence-Based Claim Verification:** Separated claim popularity from claim truth through a multi-stage evidence pipeline evaluating proof receipts and official source links.
4. **Advisory AI Moderation:** Created an extensible server-side AI provider factory running zero-trust content safety, threat classification, and rumor claim extraction without granting AI autonomous ban authority.
5. **High Reliability & Performance:** Configured strict CSP/HSTS security headers, rate limiting, TTL-based caching layer, and an automated GitHub Actions CI/CD pipeline.
