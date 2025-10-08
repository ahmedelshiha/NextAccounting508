## ✅ Completed
- [x] Merged usePerformanceMonitoring into a single canonical hook file
  - **Why**: remove duplicate .ts/.tsx drift and import ambiguity
  - **Impact**: unified API for metrics and analytics; removed unused HOC to keep hook JSX-free
- [x] Consolidated SettingsNavigation to a single source with re-export
  - **Why**: prevent UI drift between duplicated components
  - **Impact**: one implementation under components/admin/settings/ with stable import via re-export
- [x] Extracted shared health utilities to src/lib/health.ts and refactored health routes
  - **Why**: eliminate divergent health logic
  - **Impact**: admin and security health endpoints now share implementation and consistent shape
