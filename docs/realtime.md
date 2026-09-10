# Realtime Deployment

UniversiTea uses Socket.IO with `@socket.io/redis-adapter`. Redis is a required
runtime dependency for horizontally scaled deployments, not merely an optional
cache. Every production app instance must use the same `REDIS_URL`. Development
may run in single-instance fallback mode when Redis is unavailable.

```env
REDIS_URL=redis://localhost:6379
```

The custom `server.js` connects a publish client and a subscribe client before
calling `listen()`. Socket.IO room events are then forwarded across instances.

User notification rooms are protected during the Socket.IO handshake. The server
reads the `universitea_session` cookie, validates the session and account status
with PostgreSQL, and stores the authenticated user ID in `socket.data`. A
`subscribe_user` request is rejected unless its requested ID matches that value.
Community and post rooms remain public event channels; private user rooms do not.

Vote counters use the same Redis runtime. PostgreSQL stores each idempotent `Vote`
row, Redis holds pending score/upvote/downvote deltas, and the interval worker
flushes those deltas in batched updates. Reads merge pending deltas so displayed
counts stay fresh; HOT ordering can lag until a flush completes.

## Local two-instance check

1. Start Redis: `docker run --name universitea-redis -p 6379:6379 -d redis:7-alpine`.
2. Set `REDIS_URL=redis://localhost:6379` in both app environments.
3. Start two custom servers on different ports using separate `PORT` values.
4. Connect one browser/socket to each instance.
5. Trigger a vote, comment, or notification through instance A and verify the
   subscribed socket on instance B receives the event.
6. Emit `subscribe_user` with a different user ID and verify the server returns
   `{ ok: false, error: "Unauthorized user subscription" }`.
