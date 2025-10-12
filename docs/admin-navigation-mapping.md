# Admin Navigation Mapping (Registry ↔ Routes)

Source of truth: src/lib/admin/navigation-registry.ts

| Section | ID | Label | Href |
|---|---|---|---|
| dashboard | overview | Overview | /admin |
| dashboard | analytics | Analytics | /admin/analytics |
| dashboard | reports | Reports | /admin/reports |
| business | bookings | Bookings | /admin/bookings |
| business | bookings_all | All Bookings | /admin/bookings |
| business | calendar | Calendar View | /admin/calendar |
| business | availability | Availability | /admin/availability |
| business | bookings_new | New Booking | /admin/bookings/new |
| business | clients | Clients | /admin/clients |
| business | clients_all | All Clients | /admin/clients |
| business | profiles | Profiles | /admin/clients/profiles |
| business | invitations | Invitations | /admin/clients/invitations |
| business | clients_new | Add Client | /admin/clients/new |
| business | services | Services | /admin/services |
| business | services_all | All Services | /admin/services |
| business | services_categories | Categories | /admin/services/categories |
| business | services_analytics | Analytics | /admin/services/analytics |
| business | service_requests | Service Requests | /admin/service-requests |
| financial | invoices | Invoices | /admin/invoices |
| financial | invoices_all | All Invoices | /admin/invoices |
| financial | invoices_sequences | Sequences | /admin/invoices/sequences |
| financial | payments | Payments | /admin/payments |
| financial | expenses | Expenses | /admin/expenses |
| financial | taxes | Taxes | /admin/taxes |
| operations | tasks | Tasks | /admin/tasks |
| operations | team | Team | /admin/team |
| operations | chat | Chat | /admin/chat |
| operations | reminders | Reminders | /admin/reminders |
| system | settings | Settings | /admin/settings |
| system | cron_telemetry | Cron Telemetry | /admin/cron-telemetry |

Notes:
- Permissions applied at runtime via hasPermission in registry; routes exist under src/app/admin/*.
