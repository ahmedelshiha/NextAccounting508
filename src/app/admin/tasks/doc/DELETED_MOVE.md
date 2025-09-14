This task management module has been MOVED into the main app:

- New UI: src/app/admin/tasks/
- New API: src/app/api/admin/tasks/
- Shared adapters: src/lib/tasks/adapters.ts
- Realtime helper: src/lib/realtime.ts

The original temp workspace is left in place for review. To fully remove the old dev copy, delete the `temp/task management/` folder when you are ready. Note: automated deletion may be blocked by ACL; remove manually or ask the maintainer to delete the folder.
