
## ✅ Completed
- [x] Remove duplicate route: `/api/auth/register/register` → redirect to `/api/auth/register`
  - **Why**: preserve backward compatibility for older clients while consolidating registration logic
  - **Impact**: single canonical registration endpoint (`/api/auth/register`); legacy path now issues 307 redirects; reduces surface area for future drift
  - **Verification**: grep shows both paths exist but nested path only performs redirect; internal callers use canonical endpoint

## 🔧 Next Steps (updated)
- [ ] Audit auth/register callers across services and tests to replace any remaining usage of `/api/auth/register/register` with `/api/auth/register` where safe
- [ ] Add CI check to flag nested or duplicate API routes under `src/app/api/**/` to prevent regressions
