# Realtime Durable Transport Design (Multi-Instance)

Goals:
- Deliver realtime events across multiple server instances (SSR/Edge/functions) reliably.
- Preserve per-user and event-type filtering.
- Provide zero-downtime fallback to in-memory on single instance.

Current State:
- In-memory SSE hub at src/lib/realtime-enhanced.ts with per-user/event-type filtering.
- Adapter pattern added: PubSubAdapter with default InMemoryPubSub; env var REALTIME_TRANSPORT controls selection (currently only `memory`).

Options Considered:
1) Redis Pub/Sub (Upstash Redis recommended)
   - Pros: Managed, low-latency, serverless friendly, at-least-once semantics via Streams if needed.
   - Cons: Extra managed service; cost considerations.
   - Plan: Implement Redis adapter with channels per event type (e.g., `rt:all`, `rt:service-request-updated`, `rt:task-updated`, `rt:team-assignment`).
   - Security: Auth via URL; store in env REDIS_URL/REDIS_TOKEN.

2) Postgres LISTEN/NOTIFY (Neon)
   - Pros: No extra infra beyond DB; we already use Neon.
   - Cons: Payload size limits (~8KB), connection limits, no persistence/retry, noisy on heavy traffic.
   - Plan: Create `realtime_events` channel; NOTIFY with compact JSON. One long-lived connection per instance LISTENs and rebroadcasts.

3) Netlify/Provider Event Bus (when available)
   - Pros: Native infra, integrated scaling.
   - Cons: Provider lock-in, availability varies.

Recommended Rollout:
- Phase 1 (done): Adapter interface + per-user filtering; default memory transport.
- Phase 2: Implement Redis adapter; feature-flag via REALTIME_TRANSPORT=redis and env REDIS_URL.
- Phase 3: Implement Postgres adapter using @netlify/neon for LISTEN/NOTIFY; flag REALTIME_TRANSPORT=postgres.
- Phase 4: Add health checks, backpressure metrics, and reconnection with jitter.

Adapter Interface (implemented):
- publish(event), onMessage(handler)
- Service calls dispatch() which broadcasts locally and publishes to adapter; messages from adapter are rebroadcast locally without republishing.

Security and Filtering:
- Filtering remains in-process (userId + eventTypes). Server publishes neutral events; per-user filtering occurs on each instance before SSE delivery.

Env Vars:
- REALTIME_TRANSPORT: "memory" | "redis" | "postgres" (default memory)
- REDIS_URL (if redis)
- DATABASE_URL (if postgres via Neon) — already present in deployment.

Testing Strategy:
- Unit test adapter behavior (no loops, at-most-once local broadcast).
- Integration test with mock Redis server (or Upstash) in CI.
- Load test: ensure acceptable latency under 1k msgs/min.

Operational Notes:
- Ensure single long-lived subscriber per instance; re-subscribe on disconnect with exponential backoff.
- Consider partitioning by event type for throughput.
