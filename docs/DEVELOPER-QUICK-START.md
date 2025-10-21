# Developer Quick Start — Type Safety Setup

**Read This First:** 5-minute guide to get started with the new type safety system

---

## ⚡ TL;DR (Very Quick Start)

### For Existing Developers
1. Your pre-commit hook is already installed ✅
2. Your IDE should show type errors as you code ✅
3. Run `pnpm typecheck` before committing (hook does this automatically)
4. Read the [Type Safety Standards](#essential-reading) if you get stuck

### For New Developers
1. Clone the repo (hook installs automatically)
2. Read [Essential Reading](#essential-reading) below (~10 mins)
3. Check [Common Patterns](#common-patterns) when writing code
4. Run `pnpm typecheck` to verify your code

---

## 📖 Essential Reading

### Must Read (Order Matters)
1. **This document** (5 mins) — Overview & patterns
2. **[docs/ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md)** (10 mins) — Copy-paste examples
3. **[docs/TYPE-SAFETY-STANDARDS.md](./TYPE-SAFETY-STANDARDS.md)** (20 mins) — Deep dive reference

### Optional
- `docs/MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md` ��� Why we made changes
- `docs/IMPLEMENTATION-COMPLETION-REPORT.md` — Technical details

---

## 🛠️ Setup (Automatic)

### What's Already Done For You
✅ Pre-commit hook configured in `.husky/pre-commit`  
✅ GitHub Actions CI/CD workflow ready  
✅ TypeScript strict mode enabled  
✅ All team documentation created  

### First Time Using Pre-Commit?
It runs automatically when you `git commit`:
```bash
$ git commit -m "feat: add new feature"
🔍 Running TypeScript type check...
✅ Type check passed
[main abc1234] feat: add new feature
```

### If Type Check Fails
```bash
$ git commit -m "feat: add new feature"
🔍 Running TypeScript type check...
❌ TypeScript errors found. Fix them before committing:
src/schemas/my-schema.ts:10:5 - error TS2769
```

**Fix the errors, then commit again.**

---

## 🎯 Common Patterns

### Pattern 1: Creating a Zod Schema with Defaults

**❌ DON'T DO THIS:**
```typescript
const MySchema = z.object({
  channels: z.array(z.enum(['email', 'sms'])).default(['email'] as const),
  // ❌ as const creates readonly array
})
```

**✅ DO THIS:**
```typescript
function createMyDefaults(): z.infer<typeof MySchema> {
  return {
    channels: ['email'] as ('email' | 'sms')[],
    // ✅ Explicit mutable array type
  }
}

const MySchema = z.object({
  channels: z.array(z.enum(['email', 'sms'])).default(createMyDefaults),
})
```

### Pattern 2: Enum Field with Union Cast

**❌ DON'T DO THIS:**
```typescript
const provider = 'none' as const  // Creates literal type "none"
```

**✅ DO THIS:**
```typescript
const provider = 'none' as 'none' | 'twilio' | 'plivo'  // Full union
```

### Pattern 3: Select Component Type Casting

**❌ DON'T DO THIS:**
```typescript
<Select
  value={language}
  onValueChange={(value) => 
    setLanguage(value)  // value is string, language is enum
  }
/>
```

**✅ DO THIS:**
```typescript
const VALID_LANGUAGES = ['en', 'ar', 'hi'] as const
type Language = typeof VALID_LANGUAGES[number]

<Select
  value={language}
  onValueChange={(value) => {
    if (VALID_LANGUAGES.includes(value as Language)) {
      setLanguage(value as Language)
    }
  }}
/>
```

---

## 🚀 Before Each Commit

### Run This Command
```bash
pnpm typecheck
```

If it passes, you're good to commit. If it fails:
1. Read the error message
2. Check the file it mentions
3. Compare your code against [Common Patterns](#common-patterns)
4. Fix the error
5. Run `pnpm typecheck` again

### What the Hook Does
The `.husky/pre-commit` hook:
1. Runs `pnpm typecheck` automatically
2. Shows errors if any exist
3. Prevents commit if errors found
4. Runs `pnpm eslint` after type check passes

**You don't need to do anything** — it's automatic!

---

## 🐛 Troubleshooting

### Error: "readonly" is not assignable to mutable type

**What It Means:** You used `as const` on an array

**How to Fix:**
```typescript
// ❌ WRONG
channels: ['email'] as const

// ✅ CORRECT
channels: ['email'] as ('email' | 'sms' | 'push')[]
```

See: [ZOD-CASTING-STYLE-GUIDE.md - Array Types](./ZOD-CASTING-STYLE-GUIDE.md#array-types-must-be-mutable)

---

### Error: String is not assignable to enum type

**What It Means:** You're assigning a generic `string` to a specific enum

**How to Fix:**
```typescript
// ❌ WRONG
const provider = 'none'  // TypeScript sees this as string

// ✅ CORRECT
const provider = 'none' as 'none' | 'twilio' | 'plivo'  // Full union
```

See: [ZOD-CASTING-STYLE-GUIDE.md - Union Types](./ZOD-CASTING-STYLE-GUIDE.md#enum-union-type-casting)

---

### Error: Property does not exist

**What It Means:** You imported something that isn't exported

**How to Fix:**

1. Check the source file has `export`:
```typescript
// src/components/my-component/constants.ts
export const MY_CONSTANT = [...]  // ✅ Has export keyword
```

2. Then import works:
```typescript
import { MY_CONSTANT } from './constants'  // ✅ Now works
```

See: [TYPE-SAFETY-STANDARDS.md - Component Imports](./TYPE-SAFETY-STANDARDS.md#component-type-safety)

---

## 📋 Daily Workflow

### Writing Code
1. Create your component/schema
2. Use patterns from [Common Patterns](#common-patterns)
3. IDE shows type errors as you type
4. Fix them as you go

### Before Committing
1. Run `pnpm typecheck`
2. Fix any errors
3. Run `pnpm eslint . --fix` (optional, pre-commit does this)
4. `git commit` (pre-commit hook validates)

### Code Review
Reviewers can focus on logic, not types — the type system handles validation!

---

## 🎓 Learning Paths

### Path 1: Quick Learn (30 mins total)
1. This document (5 mins)
2. [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md) - Quick Reference section (5 mins)
3. Copy-paste examples when writing code
4. Time spent: **10 mins** + experience

### Path 2: Standard Learn (60 mins total)
1. This document (5 mins)
2. [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md) (15 mins)
3. [TYPE-SAFETY-STANDARDS.md](./TYPE-SAFETY-STANDARDS.md) (40 mins)
4. Practice with examples

### Path 3: Deep Dive (2+ hours)
1. All above documents (60 mins)
2. [MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md](./MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md) (40 mins)
3. [IMPLEMENTATION-COMPLETION-REPORT.md](./IMPLEMENTATION-COMPLETION-REPORT.md) (20 mins)
4. Review actual code changes in git history

---

## ✅ Checklist: Before Your First Commit

- [ ] Read this guide (5 mins)
- [ ] Run `pnpm typecheck` and see it pass
- [ ] Check that pre-commit hook is installed
- [ ] Make a small code change
- [ ] Try to commit and see the hook run
- [ ] Read [Common Patterns](#common-patterns) section

---

## 🆘 Getting Help

### For Quick Questions
→ Check [Troubleshooting](#troubleshooting) section

### For Pattern Questions
→ Read [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md)

### For Standards Questions
→ Read [TYPE-SAFETY-STANDARDS.md](./TYPE-SAFETY-STANDARDS.md)

### For Why We Made Changes
→ Read [MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md](./MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md)

---

## 🚀 Next Steps

### Today
- [ ] Read this guide
- [ ] Make sure pre-commit hook works
- [ ] Understand [Common Patterns](#common-patterns)

### This Week
- [ ] Read full [TYPE-SAFETY-STANDARDS.md](./TYPE-SAFETY-STANDARDS.md)
- [ ] Read [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md)
- [ ] Apply patterns in your code

### Questions?
Ask in #dev-chat or check the troubleshooting section above

---

## 📚 Quick Reference Card

Print this or bookmark it:

```
COMMON TYPE CASTING PATTERNS

Array types (mutable):
  ✅ ['email'] as ('email' | 'sms' | 'push')[]

Enum/union types (full union):
  ✅ 'none' as 'none' | 'twilio' | 'plivo'

Zod schema defaults (factory function):
  ✅ MySchema.default(createMyDefaults)
  
Component type casting (validate first):
  ✅ value as ValidLanguage (after validation)

Never use:
  ❌ as const (creates readonly type)
  ❌ Partial unions (must be complete)
  ❌ Inline .default({...}) (use factory)
```

---

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Status:** Ready for Use
