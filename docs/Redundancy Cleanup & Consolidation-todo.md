## ✅ Completed
- [x] Stabilized dev server command to avoid Doppler dependency
  - **Why**: Local dev crashed due to `doppler` requirement in `npm run dev`
  - **Impact**: Switched dev command to `pnpm run next-dev`; server boots on port 3000

## 🚧 In Progress
- [ ] Monitor dev logs and address any runtime errors surfaced during navigation
