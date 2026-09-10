# Resume Project Bullets — UniversiTea

> **UniversiTea** — Multi-tenant anonymous college social platform with evidence-based verification and safety controls.

## 🚀 Strongest Engineering Bullet Points

- **Multi-Tenant Campus Isolation:** Engineered multi-tenant community architecture in Next.js 16 and PostgreSQL, ensuring 100% data boundary isolation across college rooms (`/r/cec`).
- **Contextual HMAC Persona Engine:** Designed a deterministic SHA-256 HMAC thread persona system providing strict in-thread consistency while preventing cross-thread identity correlation.
- **Evidence-Based Claim Verification:** Built a multi-stage verification pipeline parsing proof receipts and institutional domain links (`.edu`/`.ac.in`) to classify rumor accuracy (`VERIFIED`, `DISPUTED`, `UNVERIFIED`).
- **AI Safety & Moderation Pipeline:** Implemented an extensible, server-side AI provider factory (`mock`, `gemini`, `openai`) executing zero-trust PII detection, rumor claim extraction, and threat classification with human-in-the-loop oversight.
- **Production Hardening & Automated Testing:** Achieved 100% test pass rate across 12 test suites (77 tests), zero TypeScript compilation errors, strict CSP/HSTS security headers, and automated GitHub Actions CI/CD.
