# UniversiTea 🍵

> **Your campus wire. Anonymously.**  
> Reddit-style anonymous social platform with public browsing, registered-user participation, evidence-backed claim verification, and AI safety controls.

---

## 🏛️ System Architecture

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

---

## 🚀 Product Model

1. **Public Browsing:** Guests can freely view communities (`/r/cec`), posts, comments, verification badges, and approved proof receipts.
2. **Registered Participation:** Creating posts, commenting, voting, submitting receipts, and filing reports requires a registered UniversiTea account (email OTP or password). No college verification required.
3. **Contextual Persona Generator:** Deterministic HMAC-SHA256 thread personas (`Anonymous Panda 🐼`) guaranteeing in-thread consistency and cross-thread non-linkability.
4. **Evidence-Based Verification:** Multi-stage receipt evaluation allowing users to corroborate claims with proof links and documents.
5. **AI Moderation & Safety:** Modular provider interface (`mock`, `gemini`, `openai`) for automatic content moderation, PII detection, rumor claim extraction, and threat analysis.

---

## 🔐 Security & Privacy Philosophy

UniversiTea operates as **Publicly Anonymous, Backend-Accountable**:
- Real email addresses, names, and IP addresses are **never** stored in plaintext or exposed in public API responses.
- One-way cryptographical SHA-256 HMAC hashes protect user identity while providing abuse accountability.
- College affiliation is **not** required for participation.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.3.4 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS
- **Database & ORM:** PostgreSQL + Prisma ORM 6.19.3
- **Authentication:** NextAuth.js / Passwordless Email OTP / Credentials
- **AI Engine:** Pluggable Provider Factory (`mock`, `gemini`, `openai`)
- **Testing:** Jest + Testing Library (16 Test Suites, 86+ Tests)
- **CI/CD:** GitHub Actions

---

## 💻 Local Setup & Development

```bash
# 1. Clone repo & install dependencies
git clone https://github.com/SughoshaVasista/UniversiTea.git
cd UniversiTea
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma client & apply database migrations
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed database with CEC community (/r/cec)
npx prisma db seed

# 5. Run test suite
npm test

# 6. Start local server
npm run dev
```

---

## 📄 Documentation

- [Architecture Specification](docs/architecture.md)
- [Security & Threat Model](docs/security.md)
- [Privacy Model](docs/privacy.md)
- [Multi-Community Architecture](docs/multi-community.md)
- [Technical Interview Masterclass](docs/interview-masterclass.md)
- [Senior Portfolio Showcase](docs/showcase.md)

---

## 📄 License

Private Repository / All Rights Reserved.
