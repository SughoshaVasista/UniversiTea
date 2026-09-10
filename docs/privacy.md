# Privacy Model & Data Protection

## 1. Privacy Philosophy

UniversiTea is **Publicly Anonymous, Backend-Accountable**. 
- Anyone can browse public communities.
- Participation requires a registered account.
- College verification is **not** required.

## 2. What We Store vs. What We Expose

| Data Point | Database Storage | Public API Exposure |
| :--- | :--- | :--- |
| **Email Address** | One-Way SHA-256 HMAC Hash (`emailHash`) | ❌ Never Exposed |
| **User Real Name** | ❌ Not Collected | ❌ Never Exposed |
| **College Student ID** | ❌ Not Collected | ❌ Never Exposed |
| **IP Address** | ❌ Not Retained in App DB | ❌ Never Exposed |
| **Thread Persona** | Thread-Scoped Generated Persona | ✅ Visible in Thread |
| **Verification History**| Action Audit Log | ✅ Verification Status Badges Only |

## 3. Practical Limitations
- Network and ISP level logs exist outside platform control.
- Formal legal requests will be addressed in accordance with applicable laws.
