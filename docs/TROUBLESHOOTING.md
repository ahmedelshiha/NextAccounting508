# Troubleshooting Guide — Type Safety Issues

**Use this guide to diagnose and fix type safety errors**

---

## Common Errors & Solutions

### Error 1: TS2769 — Readonly Array Type Mismatch

#### Full Error Message
```
Type 'readonly ["email"]' is 'readonly' and cannot be assigned 
to the mutable type '("email" | "push" | "sms")[]'
```

#### What It Means
You used `as const` on an array literal. This creates a readonly type, but Zod expects a mutable (changeable) array.

#### Root Cause
```typescript
// ❌ PROBLEM: as const creates readonly type
channels: ['email'] as const
// Type: readonly ["email"]
```

#### Solution
Use explicit mutable array type instead:

```typescript
// ✅ SOLUTION 1: In factory function
function createConfig(): z.infer<typeof MySchema> {
  return {
    channels: ['email'] as ('email' | 'sms' | 'push')[],
    //                       ✅ Mutable array type
  }
}

// ✅ SOLUTION 2: Type annotation
const channels: ('email' | 'sms' | 'push')[] = ['email']
```

#### More Information
- [TYPE-SAFETY-STANDARDS.md - Array Types](./TYPE-SAFETY-STANDARDS.md#pattern-1-simple-defaults-avoid-inline-objects)
- [ZOD-CASTING-STYLE-GUIDE.md - Array Types](./ZOD-CASTING-STYLE-GUIDE.md#array-types-must-be-mutable)

#### Where It Happens
Typically in:
- Zod schema `.default()` functions
- Factory functions for complex defaults
- Any place using arrays with specific element types

---

### Error 2: TS2769 — String Not Assignable to Enum

#### Full Error Message
```
Type 'string' is not assignable to type 
'"none" | "twilio" | "plivo" | "nexmo" | "messagebird"'
```

#### What It Means
You're trying to assign a generic `string` value to a field that expects a specific enum type.

#### Root Cause
```typescript
// ❌ PROBLEM 1: Partial union (only literal)
const provider = 'none' as const
// Type: "none" (not full union)

// ❌ PROBLEM 2: No cast at all
const provider = getProviderValue()
// Type: string (generic, not specific enum)
```

#### Solution
Cast to full union type:

```typescript
// ✅ SOLUTION 1: Full union cast
const provider = 'none' as 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird'

// ✅ SOLUTION 2: Validate then cast
const value = getUserInput()
const VALID_PROVIDERS = ['none', 'twilio', 'plivo', 'nexmo', 'messagebird'] as const
type Provider = typeof VALID_PROVIDERS[number]

if (VALID_PROVIDERS.includes(value as any)) {
  const provider = value as Provider
}

// ✅ SOLUTION 3: Use Zod validation
const result = ProviderSchema.safeParse(userInput)
if (result.success) {
  const provider = result.data
  // Type: 'none' | 'twilio' | 'plivo' | 'nexmo' | 'messagebird'
}
```

#### More Information
- [ZOD-CASTING-STYLE-GUIDE.md - Union Types](./ZOD-CASTING-STYLE-GUIDE.md#enum-union-type-casting)
- [TYPE-SAFETY-STANDARDS.md - Enum Union Types](./TYPE-SAFETY-STANDARDS.md#pattern-3-enum-union-type-defaults)

#### Where It Happens
Commonly in:
- Zod schema enum field defaults
- Component state assignments
- API response type casting
- Database value conversions

---

### Error 3: TS2345 — Argument Not Assignable to Parameter

#### Full Error Message
```
Argument of type '() => { channels: readonly ["email"]; }' is not assignable 
to parameter of type '() => { channels: ("email" | "push" | "sms")[]; }'
```

#### What It Means
Your factory function returns a type that doesn't match what Zod expects.

#### Root Cause
```typescript
// ❌ PROBLEM: Factory returns readonly array
function createConfig() {
  return {
    channels: ['email'] as const,  // readonly
  }
}

// Zod expects mutable array:
SomeSchema.default(createConfig)
```

#### Solution
Fix the factory to return correct type:

```typescript
// ✅ SOLUTION: Explicit mutable array type
function createConfig(): z.infer<typeof MySchema> {
  return {
    channels: ['email'] as ('email' | 'sms' | 'push')[],
    //       ✅ Mutable array, matches Zod expectation
  }
}

MySchema.default(createConfig)
```

#### More Information
- [TYPE-SAFETY-STANDARDS.md - Factory Functions](./TYPE-SAFETY-STANDARDS.md#pattern-2-complex-nested-defaults-factory-functions)
- [ZOD-CASTING-STYLE-GUIDE.md - Factory Functions](./ZOD-CASTING-STYLE-GUIDE.md#rule-3-factory-functions-for-complex-defaults)

#### Diagnostic Steps
1. Check if you're using `as const` (should use explicit type instead)
2. Verify return type matches `z.infer<typeof Schema>`
3. Look for readonly arrays in return statement

---

### Error 4: TS7006 — Parameter Has Implicit Any Type

#### Full Error Message
```
Parameter 'value' implicitly has an 'any' type
```

#### What It Means
You didn't specify the type of a function parameter, and TypeScript can't infer it.

#### Root Cause
```typescript
// ❌ PROBLEM: No type for parameter
function handleChange(value) {
  //                  ↑ What type is this?
  setState(value)
}

// ❌ Also a problem: Generic callback
<Select onValueChange={(value) => setState(value)} />
//      ↑ value is implicitly any
```

#### Solution
Add explicit type annotations:

```typescript
// ✅ SOLUTION 1: Explicit parameter type
function handleChange(value: string) {
  setState(value)
}

// ✅ SOLUTION 2: Validate and cast
const handleLanguageChange = (value: string) => {
  const validated = LanguageSchema.safeParse(value)
  if (validated.success) {
    setState(validated.data)
  }
}

// ✅ SOLUTION 3: Component type safety
type LocalizationData = {
  language: 'en' | 'ar' | 'hi'
}

const [data, setData] = useState<LocalizationData>({ language: 'en' })

const handleLanguageChange = (value: string) => {
  if (['en', 'ar', 'hi'].includes(value as any)) {
    setData(prev => ({ ...prev, language: value as 'en' | 'ar' | 'hi' }))
  }
}
```

#### More Information
- [TYPE-SAFETY-STANDARDS.md - Component Type Safety](./TYPE-SAFETY-STANDARDS.md#pattern-react-component-with-enum-props)
- [ZOD-CASTING-STYLE-GUIDE.md - Component Casting](./ZOD-CASTING-STYLE-GUIDE.md#scenario-3-language-selection-component)

#### Prevention
- Use TypeScript strict mode (`strict: true`)
- Enable `noImplicitAny` in tsconfig.json
- Always add type annotations to function parameters

---

### Error 5: TS2339 — Property Does Not Exist

#### Full Error Message
```
Property 'PROFILE_FIELDS' does not exist on type '...'
```

#### What It Means
You imported something that doesn't exist or isn't exported from the source file.

#### Root Cause
```typescript
// ❌ PROBLEM: Source file has no export
// constants.ts
const PROFILE_FIELDS = [...]  // Missing export!

// other.tsx
import { PROFILE_FIELDS } from './constants'
// ❌ Error: PROFILE_FIELDS does not exist
```

#### Solution
Add export to source file:

```typescript
// ✅ SOLUTION: Add export keyword
// constants.ts
export const PROFILE_FIELDS = [...]

// Now import works:
import { PROFILE_FIELDS } from './constants'
```

#### Diagnostic Steps
1. Find the source file (where constant/function is defined)
2. Check if it has `export` keyword
3. Check spelling matches exactly
4. Check file path is correct

#### More Information
- [TYPE-SAFETY-STANDARDS.md - Component Imports](./TYPE-SAFETY-STANDARDS.md#component-type-safety)

#### Where It Happens
- Importing components
- Importing constants
- Importing utility functions
- Importing types/interfaces

---

### Error 6: TS2322 — Type Not Assignable to Type

#### Full Error Message
```
Type 'X' is not assignable to type 'Y'.
```

#### What It Means
Generic type mismatch. The value you're assigning doesn't match the expected type.

#### Root Cause
Multiple possible causes:
```typescript
// ❌ Example 1: Wrong object shape
const data: MyType = {
  name: 'John',
  // email missing!
}

// ❌ Example 2: Wrong property type
const data: MyType = {
  name: 'John',
  age: 'twenty',  // Should be number
}

// ❌ Example 3: Wrong enum value
const data: MyType = {
  status: 'invalid_status'  // Not in enum
}
```

#### Solution
Fix the value to match expected type:

```typescript
// ✅ Solution 1: Use satisfies for validation
const data = {
  name: 'John',
  age: 25,
} satisfies MyType  // TypeScript catches any mismatches

// ✅ Solution 2: Use Zod validation
const result = MySchema.safeParse({
  name: 'John',
  age: 25,
})

if (result.success) {
  const data = result.data  // Type is correct
}

// ✅ Solution 3: Explicit type annotation
const data: MyType = {
  name: 'John',
  age: 25,
  status: 'active',
}
```

#### Diagnostic Steps
1. Read the error message carefully (shows what's wrong)
2. Check the object shape matches the type
3. Check all property types are correct
4. Check all required properties are present
5. Use `satisfies MyType` to test during writing

#### More Information
- [TYPE-SAFETY-STANDARDS.md - Type Inference](./TYPE-SAFETY-STANDARDS.md#when-to-use-satisfies-type-constraint)

---

## Debugging Workflow

### Step 1: Read the Error
```bash
$ pnpm typecheck

src/schemas/my-schema.ts:10:5 - error TS2769:
Type 'readonly ["email"]' is not assignable to type '("email" | "sms")[]'.
```

### Step 2: Find the Error Line
```typescript
// Line 10, column 5:
channels: ['email'] as const,
//        ^^^^^^^^ ← Error is here
```

### Step 3: Identify Error Type
Look at the error code:
- `TS2769` → See [Error 1](#error-1-ts2769--readonly-array-type-mismatch)
- `TS2345` → See [Error 3](#error-3-ts2345--argument-not-assignable-to-parameter)
- etc.

### Step 4: Find Solution
Jump to the error section and follow the solution steps

### Step 5: Test Your Fix
```bash
pnpm typecheck
```

Should pass with no errors.

---

## Quick Fix Reference

| Error | Quick Fix | Details |
|-------|-----------|---------|
| `readonly` array | Change `as const` to `as Type[]` | [Error 1](#error-1-ts2769--readonly-array-type-mismatch) |
| String vs enum | Change to `as Type` with full union | [Error 2](#error-2-ts2769--string-not-assignable-to-enum) |
| Factory return type | Verify return matches `z.infer` | [Error 3](#error-3-ts2345--argument-not-assignable-to-parameter) |
| Parameter any | Add type annotation | [Error 4](#error-4-ts7006--parameter-has-implicit-any-type) |
| Missing export | Add `export` keyword | [Error 5](#error-5-ts2339--property-does-not-exist) |
| Type mismatch | Use `satisfies` to check | [Error 6](#error-6-ts2322--type-not-assignable-to-type) |

---

## When All Else Fails

### Step 1: Run Full Type Check
```bash
pnpm typecheck
```

Get full error output.

### Step 2: Check Git Diff
```bash
git diff HEAD~1
```

See what recently changed.

### Step 3: Isolate the Problem
Create a minimal test case to understand the issue.

### Step 4: Review Standards
Check if you're following patterns from:
- `docs/ZOD-CASTING-STYLE-GUIDE.md`
- `docs/TYPE-SAFETY-STANDARDS.md`

### Step 5: Search Codebase
```bash
grep -r "as const" src/schemas/
```

Find similar patterns in codebase.

### Step 6: Check Tests
Look at existing tests or working code for examples.

---

## Prevention Tips

### Before Writing Code
1. Review [DEVELOPER-QUICK-START.md](./DEVELOPER-QUICK-START.md)
2. Check [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md) for your use case
3. Look at existing patterns in codebase

### While Writing Code
1. Let IDE show type errors as you type
2. Fix them immediately (don't ignore red squiggles)
3. Run `pnpm typecheck` frequently
4. Use `satisfies` operator to test object shapes

### Before Committing
1. Run `pnpm typecheck` one more time
2. Fix any errors
3. Commit (pre-commit hook validates)

---

## Getting Help

### Self-Help First
1. Read the error message carefully
2. Find matching error section in this guide
3. Follow the solution steps
4. Test with `pnpm typecheck`

### Documentation
- [DEVELOPER-QUICK-START.md](./DEVELOPER-QUICK-START.md) — Quick patterns
- [ZOD-CASTING-STYLE-GUIDE.md](./ZOD-CASTING-STYLE-GUIDE.md) — Style guide with examples
- [TYPE-SAFETY-STANDARDS.md](./TYPE-SAFETY-STANDARDS.md) — Deep reference

### Team
- Ask in #dev-chat for clarification
- Reference the relevant error section
- Share your code snippet

---

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Status:** Production Ready
