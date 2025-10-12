# Design References & Component Specs

Benchmarks: QuickBooks (information density + left nav), Notion (keyboard + search), Linear (speed + focus states).

## Sidebar
- Behaviors: collapse/expand, resizable (pointer + keyboard), badges, permission-gated items.
- Accessibility: roving tabindex, aria-current for active, min contrast, focus ring.

## Header
- Tenant switcher, global search, quick actions; consistent height.

## SettingsShell
- Sticky header with title, save state, search, tabs; responsive content width.

## Keyboard Shortcuts
- Mod+B toggle sidebar; Mod+[ collapse; Mod+] expand; search focus shortcut.

Implementation aligns with src/components/admin/layout and registry at src/lib/admin/navigation-registry.ts.
