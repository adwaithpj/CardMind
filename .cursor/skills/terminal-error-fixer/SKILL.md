---
name: terminal-error-fixer
description: >-
  Automatically reads terminal errors, diagnoses root causes, applies fixes to
  source files, and appends every error with its resolution to
  error-logs/errors.md. Use when the user reports a terminal error, build
  failure, TypeScript error, lint error, runtime exception, or asks to fix
  errors shown in the terminal.
---

# Terminal Error Fixer

## Workflow

1. **Read terminal output** — check the terminals folder for active terminals and read the latest output.
2. **Diagnose** — identify error type, file, line number, and root cause.
3. **Fix** — apply the minimal correct change to source files.
4. **Log** — append the error + fix to `error-logs/errors.md` (create file/folder if missing).
5. **Verify** — re-read the terminal or re-run the failing command to confirm the fix worked.

## Reading Terminals

The terminals folder is at `C:\Users\adwai\.cursor\projects\d-PROGRAMMING-Projects-2026-pdfcardmaker/terminals`.

```bash
# Quick overview of all terminals
head -n 10 *.txt
```

Read the relevant `.txt` file to see the full error output.

## Error Log Format

**File**: `error-logs/errors.md` (project root)

Append each new error as a block — never edit or delete existing entries:

```markdown
---

## [ERROR_TYPE] — YYYY-MM-DD HH:MM

**Terminal**: `<terminal id or command>`
**File**: `src/path/to/file.ts:LINE`
**Error**:
\`\`\`
<exact error message>
\`\`\`
**Root cause**: One-sentence explanation.
**Fix applied**: What change was made and why.
**Status**: ✅ Resolved | ⚠️ Partial | ❌ Unresolved
```

## Common Error Types & Fixes

### TypeScript / Build Errors
- Read the exact TS error code (e.g., `TS2345`)
- Fix types at the call site; avoid casting with `as any`
- Run `npx tsc --noEmit` to verify no remaining type errors

### Next.js Runtime Errors
- Check if it is a server vs. client component issue (`"use client"` missing)
- Verify env variables exist in `.env.local`
- Check for missing `await` on async Server Component data fetches

### Drizzle / Database Errors
- Never use raw SQL strings — use Drizzle query builder
- Check schema column names match the query (snake_case in DB, camelCase in TS via Drizzle)

### ESLint / Lint Errors
- Fix the lint violation; do not add `// eslint-disable` unless the rule is genuinely wrong for the case
- Run `npx eslint src --fix` for auto-fixable issues first

### Dependency / Module Not Found
- Run `npm install <package>` to add missing deps
- Check import path casing on Windows (case-insensitive FS can mask issues)

## Logging Rules

- **Always log** — every error encountered, even if trivially fixed.
- **One entry per error occurrence** — do not merge separate errors into one entry.
- **Log before closing the task** — log even if the fix was immediate.
- **If fix failed** — mark `Status: ❌ Unresolved` and describe what was tried.

## Creating the Log File

If `error-logs/errors.md` does not exist:

```markdown
# Error Log

All terminal errors and their resolutions are tracked here automatically.
Each entry is appended by the terminal-error-fixer skill.

---
```

Then append the first error entry below.
