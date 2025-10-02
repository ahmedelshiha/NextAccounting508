# Organization Settings Audit & Fix TODO

... (existing content)

### Phase 5 – UI/UX Alignment
- [x] Add success/error feedback on Save (toasts) in all Organization tabs.
- [x] Centralize header/footer to use SettingsProvider (Navigation + OptimizedFooter now prefer provider values).
- [ ] Move quick toggles into Modal/Popover where appropriate.
- [ ] Move org-wide controls into Dedicated Settings Page (already present).
- [ ] Avoid mixing component-only preferences with org-level policies.

Notes: Navigation and OptimizedFooter now read from SettingsProvider when available; they still accept props for SSR hydration/fallback.

... (rest unchanged)
