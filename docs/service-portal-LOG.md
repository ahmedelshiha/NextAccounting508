

Summary:
- Added server WebSocket endpoint: /api/ws/bookings (src/app/api/ws/bookings/route.ts). Uses Next runtime WebSocketPair to upgrade and bridges realtimeService events to clients.
- Implemented client hook with WebSocket first and SSE fallback: src/hooks/useBookingsSocket.ts.
- Updated existing useRealtime hook to try WebSocket endpoint and fallback to SSE for compatibility.

Why:
- Provides lower-latency, bidirectional realtime updates (availability changes, assignments, booking events) while preserving existing SSE support.

Files changed/added:
- src/app/api/ws/bookings/route.ts (NEW)
- src/hooks/useBookingsSocket.ts (NEW)
- src/hooks/useRealtime.ts (UPDATED) — now attempts WebSocket before SSE
- docs/service-portal-TODO.md (UPDATED)

Next steps:
- Optionally add authentication/permissions for WS connections (token or session support).
- Add client-side subscription management UI where appropriate.

Logged by: Autonomous Dev (assistant)
