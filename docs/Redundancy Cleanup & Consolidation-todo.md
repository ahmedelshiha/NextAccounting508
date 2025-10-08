
## ✅ Completed (append)
- [x] Merge usePerformanceMonitoring across /hooks and /components
  - **Why**: eliminate duplicate implementations and provide a single hook for performance monitoring across admin UI
  - **Impact**: single canonical hook at `src/hooks/usePerformanceMonitoring.ts`; updated imports across components to use new path; legacy implementation removed
  - **Verification**: no imports reference `@/hooks/admin/usePerformanceMonitoring`; consolidated hook file present and components consuming it
  - **Next**: run pnpm typecheck and tests to ensure no regressions
