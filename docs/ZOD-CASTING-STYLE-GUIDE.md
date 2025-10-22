# Zod Schema & Type Casting Style Guide

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Target Audience:** Development Team

---

## Quick Reference

### Array Type Casting

```typescript
// ❌ DO NOT USE: readonly type
const channels = ['email'] as const

// ✅ CORRECT: mutable array type
const channels = ['email'] as ('email' | 'sms' | 'push')[]
```

### Enum/Union Type Casting

```typescript
// ❌ DO NOT USE: partial union or literal-only
const provider = 'none' as const

// ✅ CORRECT: full union type
const provider = 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird'
```

### Zod Schema Defaults

```typescript
// ❌ DO NOT USE: inline objects with as const
SmsSettingsSchema.default(() => ({
  provider: 'none' as const,
  enabled: false,
}))

// ✅ CORRECT: factory function with explicit types
function createSmsSettings(): z.infer<typeof SmsSettingsSchema> {
  return {
    provider: 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird',
    enabled: false,
  }
}

SmsSettingsSchema.default(createSmsSettings)
```

---

## Detailed Rules

### Rule 1: Array Types Must Be Mutable

**Why:** Zod expects mutable array types. Readonly arrays are incompatible with array schema validation.

```typescript
// ❌ WRONG: Creates readonly ["email"]
const config = () => ({
  channels: ['email'] as const,
})

// ✅ CORRECT: Explicit mutable array
const config = () => ({
  channels: ['email'] as ('email' | 'sms' | 'push')[],
})

// ✅ ALSO CORRECT: Type annotation
const channels: ('email' | 'sms' | 'push')[] = ['email']
```

### Rule 2: Union Types Must Be Complete

**Why:** TypeScript can't prove a value satisfies a union if only the literal is cast.

```typescript
// ❌ WRONG: Only casts to literal "none"
const provider = 'none' as const
// Type inferred: "none" (not the full union)

// ❌ WRONG: Partial union
const provider = 'none' as 'none' | 'twilio'

// ✅ CORRECT: Full union cast
const provider = 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird'
```

### Rule 3: Factory Functions for Complex Defaults

**Why:** Ensures proper type inference and separates schema definition from default logic.

**For simple defaults:**
```typescript
const schema = z.object({
  name: z.string().default('Unknown'),
  enabled: z.boolean().default(true),
})
```

**For complex defaults:**
```typescript
// Define factory function
function createRemindersSettings(): z.infer<typeof RemindersSettingsSchema> {
  return {
    bookings: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
    invoices: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
    tasks: {
      enabled: true,
      offsetHours: 24,
      channels: ['email'] as ('email' | 'sms' | 'push')[],
    },
  }
}

// Use factory in schema
const RemindersSettingsSchema = z.object({
  bookings: ReminderConfigSchema,
  invoices: ReminderConfigSchema,
  tasks: ReminderConfigSchema,
})

export const CommunicationSettingsSchema = z.object({
  reminders: RemindersSettingsSchema.default(createRemindersSettings),
})
```

### Rule 4: Nested Object Type Casting

**Why:** All nested levels require explicit types.

```typescript
// ❌ WRONG: Nested readonly arrays
const defaults = () => ({
  reminders: {
    bookings: {
      channels: ['email'] as const,  // ❌ readonly at nested level
    },
  },
})

// ✅ CORRECT: Explicit types at all levels
const defaults = () => ({
  reminders: {
    bookings: {
      channels: ['email'] as ('email' | 'sms' | 'push')[],  // ✅ mutable
    },
  },
})
```

### Rule 5: Component Type Casting in Callbacks

**Why:** Third-party components may pass generic types (string) that need narrowing.

```typescript
// ❌ WRONG: Direct assignment of string to enum
<Select
  value={language}
  onValueChange={(value) => 
    setData(prev => ({ ...prev, language: value }))  // value is string!
  }
/>

// ✅ CORRECT: Validate and cast
const VALID_LANGUAGES = ['en', 'ar', 'hi'] as const
type Language = typeof VALID_LANGUAGES[number]

<Select
  value={language}
  onValueChange={(value) => {
    if (VALID_LANGUAGES.includes(value as Language)) {
      setData(prev => ({ ...prev, language: value as Language }))
    }
  }}
/>

// ✅ OR: Use helper function
const handleLanguageChange = (value: string) => {
  const validated = PreferencesSchema.shape.preferredLanguage.safeParse(value)
  if (validated.success) {
    setData(prev => ({ ...prev, language: validated.data }))
  }
}
```

---

## Common Scenarios

### Scenario 1: SMS Provider Configuration

```typescript
// Schema definition
export const SmsSettingsSchema = z.object({
  provider: z.enum(['none', 'twilio', 'plivo', 'nexmo', 'messagebird']),
  transactionalEnabled: z.boolean(),
  marketingEnabled: z.boolean(),
  fallbackToEmail: z.boolean(),
})

// Factory function
function createSmsSettings(): z.infer<typeof SmsSettingsSchema> {
  return {
    provider: 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird',
    transactionalEnabled: false,
    marketingEnabled: false,
    fallbackToEmail: true,
  }
}

// Use in parent schema
export const CommunicationSettingsSchema = z.object({
  sms: SmsSettingsSchema.default(createSmsSettings),
})
```

### Scenario 2: Nested Reminder Configuration

```typescript
// Individual reminder config
function createReminderConfig(type: 'bookings' | 'invoices' | 'tasks'): z.infer<typeof ReminderConfigSchema> {
  return {
    enabled: true,
    offsetHours: 24,
    channels: ['email'] as ('email' | 'sms' | 'push')[],
    templateId: undefined,
  }
}

// Nested reminders structure
function createRemindersSettings(): z.infer<typeof RemindersSettingsSchema> {
  return {
    bookings: createReminderConfig('bookings'),
    invoices: createReminderConfig('invoices'),
    tasks: createReminderConfig('tasks'),
  }
}

// Schema
export const RemindersSettingsSchema = z.object({
  bookings: ReminderConfigSchema,
  invoices: ReminderConfigSchema,
  tasks: ReminderConfigSchema,
})

export const CommunicationSettingsSchema = z.object({
  reminders: RemindersSettingsSchema.default(createRemindersSettings),
})
```

### Scenario 3: Language Selection Component

```typescript
interface LocalizationData {
  preferredLanguage: 'en' | 'ar' | 'hi'
  timezone: string
}

export default function LocalizationTab() {
  const [data, setData] = useState<LocalizationData>({
    preferredLanguage: 'en',
    timezone: 'UTC',
  })

  const VALID_LANGUAGES = ['en', 'ar', 'hi'] as const
  type Language = typeof VALID_LANGUAGES[number]

  const handleLanguageChange = (value: string) => {
    // Validate before assigning
    if (VALID_LANGUAGES.includes(value as any)) {
      setData(prev => ({
        ...prev,
        preferredLanguage: value as Language,
      }))
    } else {
      console.error('Invalid language:', value)
    }
  }

  return (
    <Select
      value={data.preferredLanguage}
      onValueChange={handleLanguageChange}
    >
      <SelectContent>
        {VALID_LANGUAGES.map(lang => (
          <SelectItem key={lang} value={lang}>
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## Type Inference Patterns

### Pattern 1: Extract Type from Schema

```typescript
// Define schema
const ReminderConfigSchema = z.object({
  enabled: z.boolean(),
  offsetHours: z.number(),
  channels: z.array(z.enum(['email', 'sms', 'push'])),
})

// Extract type
type ReminderConfig = z.infer<typeof ReminderConfigSchema>

// Use in factory
function createReminderConfig(): ReminderConfig {
  return {
    enabled: true,
    offsetHours: 24,
    channels: ['email'] as ('email' | 'sms' | 'push')[],
  }
}
```

### Pattern 2: Constrain Object Literal

```typescript
// Good for one-off values
const config = {
  enabled: true,
  provider: 'twilio',
  channels: ['email', 'sms'],
} satisfies z.infer<typeof SmsSettingsSchema>

// If you make a typo, TypeScript catches it:
const badConfig = {
  enabledd: true,  // ❌ Error: typo caught!
} satisfies z.infer<typeof SmsSettingsSchema>
```

---

## Migration Checklist

When refactoring existing code:

- [ ] All `.default()` inline objects → factory functions
- [ ] All `as const` on arrays → explicit array types `as Type[]`
- [ ] All partial union casts → full union types
- [ ] All component string callbacks → validated type casts
- [ ] All nested object defaults → explicit type annotations at all levels
- [ ] Run `pnpm typecheck` and fix remaining errors
- [ ] Test in browser to verify no runtime changes

---

## Troubleshooting

### Error: "readonly" is not assignable to mutable type

**Cause:** Using `as const` instead of explicit array type

**Fix:**
```typescript
// ❌ WRONG
channels: ['email'] as const

// ✅ CORRECT
channels: ['email'] as ('email' | 'sms' | 'push')[]
```

### Error: String is not assignable to enum type

**Cause:** Missing explicit cast or partial union type

**Fix:**
```typescript
// ❌ WRONG
const provider = 'none'  // Treated as string

// ✅ CORRECT
const provider = 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird'
```

### Error: Property does not exist on type

**Cause:** Component import not exported from source file

**Fix:**
```typescript
// In source file (constants.ts)
export const PROFILE_FIELDS = [...]  // Add export keyword

// In component
import { PROFILE_FIELDS } from './constants'  // Now works!
```

---

## Code Review Checklist

When reviewing PRs, ensure:

- [ ] No `as const` on array types
- [ ] All union type casts are complete
- [ ] All Zod defaults use factory functions
- [ ] All component type casts are validated
- [ ] No `any` types used
- [ ] `pnpm typecheck` passes
- [ ] Tests cover type-safe paths

---

## Resources

- [Type Safety Standards](./TYPE-SAFETY-STANDARDS.md)
- [Manage Profile Audit](./MANAGE-PROFILE-AUDIT-2025-10-21-UPDATED.md)
- [Manage Profile Technical Findings](./MANAGE-PROFILE-TECHNICAL-FINDINGS.md)

