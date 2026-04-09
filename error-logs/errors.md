# Error Log

All terminal errors and their resolutions are tracked here automatically.
Each entry is appended by the terminal-error-fixer skill.

<!-- Format per entry:
---
## [ERROR_TYPE] — YYYY-MM-DD HH:MM
**Terminal**: `<id or command>`
**File**: `src/path/to/file.ts:LINE`
**Error**: ```<message>```
**Root cause**: ...
**Fix applied**: ...
**Status**: ✅ Resolved | ⚠️ Partial | ❌ Unresolved
-->

---

## [Next.js Runtime] — 2026-04-09 (session start)

**Terminal**: `npm run dev`
**File**: `.next/server/middleware-manifest.json` (missing)
**Error**:
```
Error: Cannot find module 'D:\PROGRAMMING\Projects 2026\pdfcardmaker\.next\server\middleware-manifest.json'
Require stack:
- node_modules\next\dist\server\next-server.js
- node_modules\next\dist\server\dev\next-dev-server.js
- node_modules\next\dist\server\next.js
- node_modules\next\dist\server\lib\start-server.js
```
**Root cause**: The `.next` build cache was corrupted or incompletely generated (e.g. an interrupted previous build), causing Next.js to fail at boot when it could not find `middleware-manifest.json`.
**Fix applied**: Deleted the entire `.next` directory so Next.js regenerates all build artifacts cleanly on the next `npm run dev`.
**Status**: ✅ Resolved

---

## [Prisma Runtime — P2021] — 2026-04-09

**Terminal**: `npm run dev`
**File**: `src/lib/auth.ts:21` · `src/app/api/auth/register/route.ts:17`
**Error**:
```
PrismaClientKnownRequestError:
Invalid `prisma.user.findUnique()` invocation:
The table `public.users` does not exist in the current database.
```
**Root cause**: `prisma db push` was never run after project setup, so none of the tables (`users`, `decks`, `cards`, `review_logs`) existed in the Neon PostgreSQL database.
**Fix applied**:
1. Ran `npx prisma db push` — loaded `prisma.config.ts` which uses `DIRECT_URL` from `.env.local`; all 4 tables created in Neon (`backend` schema, `public` namespace) in 3.71s.
2. Replaced the `NEXTAUTH_SECRET` placeholder value in `.env.local` with a real 32-byte base64 secret (was: literal string `"generate-with: openssl rand -base64 32"`).
**Status**: ✅ Resolved

---

## [Gemini API — 429 RESOURCE_EXHAUSTED] — 2026-04-09

**Terminal**: `npm run dev` → `POST /api/upload`
**File**: `src/lib/gemini/generate-cards.ts:128` (`inferDeckTitle`)
**Error**:
```
Title inference failed: Error [ApiError]: {"error":{"code":429,"status":"RESOURCE_EXHAUSTED",
  "message":"Quota exceeded ... limit: 0, model: gemini-2.0-flash ... retryDelay: 54s"}}
```
**Root cause**: `client.ts` had `MODEL = "gemini-2.0-flash"` which has zero free-tier quota (`limit: 0`) for this API key. Both `inferDeckTitle` and `generateCardsFromPdf` retried with a flat 1.5 s sleep that ignores the `retryDelay` field the API returns.
**Fix applied**:
1. `src/lib/gemini/client.ts` — changed `MODEL` from `"gemini-2.0-flash"` to `"gemini-1.5-flash"` (has free-tier access).
2. `src/lib/gemini/generate-cards.ts` — added `is429()` and `getRetryDelayMs()` helpers; retry sleeps now read the `retryDelay` value from the 429 body (e.g. 54 s + 500 ms buffer) instead of a fixed 1.5 s.
3. `inferDeckTitle` — refactored from single-attempt + silent catch to a retry loop (2 retries) with proper 429 backoff; falls back to filename on exhausted retries with a `console.warn` (no silent swallowing).
4. Updated all `gemini-2.0-flash` references in `GEMINI.md` to `gemini-1.5-flash`.
**Status**: ✅ Resolved
