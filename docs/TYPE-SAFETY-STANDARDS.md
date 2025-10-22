# Type Safety Standards & Best Practices

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Status:** Production Guidelines

---

## Overview

This document provides standards and best practices for achieving production-level type safety across the codebase, with emphasis on Zod schema management, explicit type casting, and TypeScript strict mode compliance.

---

## Table of Contents

1. [TypeScript Configuration](#typescript-configuration)
2. [Zod Schema Patterns](#zod-schema-patterns)
3. [Type Casting Guidelines](#type-casting-guidelines)
4. [Component Type Safety](#component-type-safety)
5. [API Route Type Safety](#api-route-type-safety)
6. [Common Patterns & Anti-Patterns](#common-patterns--anti-patterns)
7. [Tools & Automation](#tools--automation)

---

## TypeScript Configuration

### Strict Mode (Required)

All projects must have TypeScript strict mode enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

### Build Pipeline

Type checking must occur **before** linting in the build pipeline:

```bash
# ✅ CORRECT ORDER
1. pnpm prisma generate
2. pnpm typecheck        # Fast type check (fail fast)
3. pnpm eslint .         # Linting
4. pnpm build            # Next.js build
```

---

## Zod Schema Patterns

### Pattern 1: Simple Defaults (❌ Avoid Inline Objects)

**Bad Practice:**
```typescript
const UserSchema = z.object({
  name: z.string().default('Unknown'),
  email: z.string().email().default(''),
  channels: z.array(z.enum(['email', 'sms'])).default(['email'] as const),
  // ❌ as const creates readonly, fails type checking
})
```

**Good Practice:**
```typescript
function createChannelDefaults(): ('email' | 'sms')[] {
  return ['email']
}

const UserSchema = z.object({
  name: z.string().default('Unknown'),
  email: z.string().email().default(''),
  channels: z.array(z.enum(['email', 'sms'])).default(createChannelDefaults),
})
```

### Pattern 2: Complex Nested Defaults (Factory Functions)

**Factory function approach:**
```typescript
function createReminderConfig(): z.infer<typeof ReminderConfigSchema> {
  return {
    enabled: true,
    offsetHours: 24,
    channels: ['email'] as ('email' | 'sms' | 'push')[],
    templateId: undefined,
  }
}

const ReminderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  offsetHours: z.number().min(1).max(720).default(24),
  channels: z.array(z.enum(['email', 'sms', 'push'])).default(createChannelDefaults),
  templateId: z.string().optional(),
})
```

**Benefits:**
- ✅ Full type inference (`z.infer<typeof ReminderConfigSchema>`)
- ✅ Explicit type casts within functions
- ✅ Reusable defaults
- ✅ Better readability

### Pattern 3: Enum/Union Type Defaults

**Always use full union types, never `as const`:**

```typescript
// ❌ WRONG: as const creates literal type "email"
const config = z.object({
  provider: z.enum(['email', 'sms', 'push']).default('email' as const),
})

// ✅ CORRECT: Full union type cast
const config = z.object({
  provider: z.enum(['email', 'sms', 'push']).default('email'),
})

// ✅ FOR COMPLEX ENUMS: Explicit cast
const SmsSchema = z.object({
  provider: z.enum(['none', 'twilio', 'plivo', 'nexmo', 'messagebird']).default('none'),
})
```

### Pattern 4: Array Type Inference

**Mutable vs Readonly Arrays:**

```typescript
// ❌ WRONG: readonly array type
const channels = ['email', 'sms'] as const
// Type: readonly ["email", "sms"]

// ✅ CORRECT: mutable array type
const channels = ['email', 'sms'] as ('email' | 'sms')[]
// Type: ('email' | 'sms')[]

// ✅ IN SCHEMA CONTEXT:
ReminderSchema.default(() => ({
  channels: ['email'] as ('email' | 'sms' | 'push')[],
}))
```

---

## Type Casting Guidelines

### When to Use `as` (Type Assertion)

Use `as` when you **promise TypeScript** a more specific type:

```typescript
// ✅ Valid: You know the runtime value is correct
const email = data.email as 'admin@example.com'

// ✅ Valid: Converting from string to enum
const language = value as 'en' | 'ar' | 'hi'

// ✅ Valid: Factory function return types
const config = () => ({
  provider: 'none' as 'none' | 'twilio' | 'plivo',
})
```

### When to Use `satisfies` (Type Constraint)

Use `satisfies` when you want TypeScript to **verify** against a type:

```typescript
// ✅ BETTER: Type must match exactly
const config = {
  enabled: true,
  channels: ['email', 'sms'],
} satisfies z.infer<typeof ReminderConfigSchema>

// If you make a typo or wrong value, TypeScript catches it:
const badConfig = {
  enabled: 'yes',  // ❌ Error: should be boolean
} satisfies z.infer<typeof ReminderConfigSchema>
```

### Explicit Type Casts Hierarchy

**Prefer this order:**

1. **No cast needed** (best)
   ```typescript
   const timezone = 'UTC'  // Literal type, matches schema
   ```

2. **Inference assistance** (good)
   ```typescript
   const values: ('email' | 'sms')[] = ['email']
   ```

3. **`satisfies` operator** (better)
   ```typescript
   const config = { ... } satisfies ReminderConfig
   ```

4. **`as` casting** (last resort)
   ```typescript
   const provider = value as 'none' | 'twilio'
   ```

---

## Component Type Safety

### Pattern: React Component with Enum Props

**Problem:** Select component passes `string`, but you need specific type

```typescript
interface LocalizationData {
  preferredLanguage: 'en' | 'ar' | 'hi'
}

export default function LocalizationTab() {
  const [data, setData] = useState<LocalizationData>({
    preferredLanguage: 'en',
  })

  const handleLanguageChange = (value: string) => {
    // ❌ Can't assign string to 'en' | 'ar' | 'hi'
    setData(prev => ({ ...prev, preferredLanguage: value }))
  }

  return (
    <Select
      value={data.preferredLanguage}
      onValueChange={handleLanguageChange}
    />
  )
}
```

**Solution: Validate and cast**

```typescript
function LocalizationTab() {
  const [data, setData] = useState<LocalizationData>({
    preferredLanguage: 'en',
  })

  const VALID_LANGUAGES = ['en', 'ar', 'hi'] as const
  type Language = typeof VALID_LANGUAGES[number]

  const handleLanguageChange = (value: string) => {
    if (VALID_LANGUAGES.includes(value as Language)) {
      setData(prev => ({
        ...prev,
        preferredLanguage: value as Language,
      }))
    } else {
      toast.error('Invalid language selection')
    }
  }

  return (
    <Select
      value={data.preferredLanguage}
      onValueChange={handleLanguageChange}
    />
  )
}
```

---

## API Route Type Safety

### Pattern: Wrap Routes with `withTenantContext`

**All authenticated API routes must use the `withTenantContext` wrapper:**

```typescript
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const userId = ctx.userId
    const tenantId = ctx.tenantId

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Route logic...
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
```

### Pattern: Request Body Validation

**Always validate request bodies with Zod:**

```typescript
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => ({}))

    // Validate with Zod
    const result = YourSchema.safeParse(body)
    if (!result.success) {
      const messages = result.error.issues
        .map(i => i.message)
        .join('; ')
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      )
    }

    const validatedData = result.data
    // Process validatedData...

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
```

---

## Common Patterns & Anti-Patterns

### Pattern: Initializing State with Schema Defaults

**Good:**
```typescript
import { PreferencesSchema } from '@/schemas/user-profile'

type Preferences = z.infer<typeof PreferencesSchema>

const [preferences, setPreferences] = useState<Preferences>(() => {
  const defaults = PreferencesSchema.parse({})
  return defaults
})
```

### Anti-Pattern: Using `any` Type

**❌ NEVER:**
```typescript
const data: any = response.json()
// TypeScript won't catch errors, defeats purpose of strict mode
```

**✅ ALWAYS:**
```typescript
const result = YourSchema.safeParse(response.json())
if (!result.success) throw new Error(result.error.message)
const data = result.data  // Now properly typed
```

### Anti-Pattern: Loose Enum Type Casting

**❌ WRONG:**
```typescript
const provider = 'invalid' as 'none' | 'twilio'  // No validation!
```

**✅ RIGHT:**
```typescript
const validProviders = ['none', 'twilio'] as const
if (validProviders.includes(userInput)) {
  const provider = userInput as typeof validProviders[number]
}
```

---

## Tools & Automation

### Pre-Commit Type Checking

Husky ensures type checking before commits:

```bash
# .husky/pre-commit
pnpm typecheck || exit 1
```

**Benefits:**
- ✅ Catch errors before push
- ✅ No broken commits to main
- ✅ Faster feedback loop

### CI/CD Type Validation

GitHub Actions validates on every PR:

```yaml
# .github/workflows/typecheck.yml
- name: Run TypeScript type check
  run: pnpm typecheck
```

### VS Code Settings

Enable strict type checking in your editor:

```json
{
  "typescript.tsserver.watchOptions": {
    "watchFile": "useFsEvents",
    "watchDirectory": "useFsEvents"
  },
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```

---

## Checklist: Before Committing Code

- [ ] `pnpm typecheck` passes without warnings
- [ ] All `any` types removed (except for legitimate third-party library types)
- [ ] All Zod defaults use factory functions
- [ ] All union type casts include full type list
- [ ] All mutable arrays use explicit array type (not `as const`)
- [ ] All component imports are exported from source files
- [ ] API routes use `withTenantContext` wrapper
- [ ] Request bodies validated with Zod schemas
- [ ] No `type` assertions without validation

---

## Migration Guide: Fixing Existing Code

### Step 1: Run Type Check
```bash
pnpm typecheck > /tmp/errors.log 2>&1
```

### Step 2: Fix Zod Schema Errors
- Replace inline `.default({...})` with factory functions
- Add explicit union type casts
- Change mutable array types (remove `as const`)

### Step 3: Fix Component Errors
- Add explicit casts for Select/input callbacks
- Validate enum values before casting
- Use `satisfies` operator where possible

### Step 4: Verify and Commit
```bash
pnpm typecheck          # Should pass
pnpm eslint . --fix     # Fix linting issues
git commit -m "fix: improve type safety"
```

---

## References

- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Zod Documentation](https://zod.dev)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

**Questions?** Refer to the [Manage Profile Enhancement Audit](./MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md) for implementation examples.
