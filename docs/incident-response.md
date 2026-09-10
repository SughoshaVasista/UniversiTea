# Incident Response

## Identity or privacy leak

Disable the affected endpoint, preserve audit logs, revoke impacted sessions, inspect public responses for account identifiers, and notify affected users after scope is confirmed.

## Database outage

Keep public read paths on their safe fallback where available, pause writes that cannot be verified, restore from the latest tested backup, and verify session and moderation integrity before reopening writes.

## Spam or coordinated abuse

Rate-limit the affected route, restrict abusive accounts, review reports in bulk with preview and audit logging, and avoid exposing contextual identity mappings.

## AI failure

Disable the failing AI worker and continue with deterministic validation plus human moderation. AI must never be the sole authority for truth, identity, or account sanctions.

## Moderation overload

Prioritize safety, privacy, and security reports, communicate degraded review times, and avoid irreversible bulk deletion without explicit confirmation.
