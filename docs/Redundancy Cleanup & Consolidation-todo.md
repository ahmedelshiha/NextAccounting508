## ✅ Completed (append)
- [x] Consolidated cron reminders into src/lib/cron/reminders.ts and refactored API + Netlify function to depend on it
  - **Why**: remove logic drift across entry points
  - **Impact**: single source of truth for reminder processing; Netlify function falls back to shared runner when origin absent
