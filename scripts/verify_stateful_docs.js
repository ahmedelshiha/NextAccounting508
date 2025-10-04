#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  path.join(process.cwd(), 'docs', 'Comprehensive Tenant System-todo.md'),
  path.join(process.cwd(), 'docs', 'tenant-system-audit.md'),
];

let ok = true;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`[stateful-docs] Missing: ${path.relative(process.cwd(), file)}`);
    ok = false;
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const hasMarker = /AI Agent (Context|Stateful Workflow)/i.test(content);
  if (!hasMarker) {
    console.error(`[stateful-docs] Missing AI Agent entry in: ${path.relative(process.cwd(), file)}`);
    ok = false;
  }
}

if (!ok) {
  console.error('[stateful-docs] Validation failed. Please update the docs before committing.');
  process.exit(1);
}
console.log('[stateful-docs] OK');
