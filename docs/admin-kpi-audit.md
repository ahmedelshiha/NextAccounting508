# Admin KPI Audit

Objective: prioritize navigation and UX improvements using available structure and endpoints.

## Candidate KPIs
- Booking funnel: created → confirmed → completed (from /api/admin/bookings/stats).
- Client growth: net new clients and active clients (from /api/admin/stats/clients).
- Service performance: conversion and revenue (from /api/admin/services/stats).
- Task throughput: created/completed/overdue (from /api/admin/tasks/analytics and counts).
- Financials: invoices issued/paid, DSO (from /api/admin/invoices, /api/admin/stats).

## Hot Routes (by critical operations)
- /admin/bookings, /admin/calendar, /admin/clients, /admin/services, /admin/invoices, /admin/tasks, /admin/settings.

## Pain Points (anticipated from structure audit)
- Inconsistent layout variants; duplicated fetches for counts; discoverability of settings.

## Actions
- Elevate Bookings, Clients, Services in sidebar order (already grouped under Business).
- Cache shared stats/counts centrally to cut redundant requests.
- Expand SettingsSearch prominence and add keyboard shortcut.

Data sources audited: docs/admin-dashboard-structure-audit.md, src/app/api/admin/* endpoints.
