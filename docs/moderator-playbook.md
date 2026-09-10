# Moderator Playbook & Operating Procedures — UniversiTea

> **Scope:** Guidelines for community moderators handling reports and evidence in `/r/cec`.

## 1. Safety Escalation Protocols

### 🚨 Critical Severity (Threats & Doxxing)
- **Signal:** Direct physical threats, release of non-public personal contact information, or harassment.
- **Action:** Immediately set Post/Comment status to `HIDDEN`, create a `ModerationAction` audit entry, and notify Super Admins for account status review.

### 🟡 Medium Severity (Unverified Serious Allegations)
- **Signal:** Targeted allegations against individuals without corroborating proof receipts.
- **Action:** Route item to `CHECKING` / `UNVERIFIED` state, request evidence receipts, and hide unverified personal identity accusations.

## 2. Receipt Evaluation Checklist

When evaluating submitted proof receipts:
1. Verify if the source domain belongs to an official institution (`.edu`, `.ac.in`, or official portal).
2. Check if screenshots or documents contain altered text or forged metadata.
3. Update verification status to `VERIFIED` only when official proof is confirmed.
4. Mark conflicting evidence as `DISPUTED`.
