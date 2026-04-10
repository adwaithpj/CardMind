# CardMind — PDF Flashcard Engine
## Gemini CLI Project Context

> Turn any PDF into a smart flashcard deck using Gemini AI and SM-2 spaced repetition.

---

## Product vision (`flashcard_app_ideas.md`)

The north-star doc in the repo is **`flashcard_app_ideas.md`**: concept extraction, multiple card types, FSRS, streaks, Zen/cram modes, concept graphs, collaboration, etc. It is the backlog and design reference — not all items are built yet.

**Shipped in app (incremental):**

| Idea bucket | What we built |
|-------------|----------------|
| Sec. 3 Session modes | **Cram** `?mode=cram` — up to 100 cards, ignores SRS mix; **Zen** `?zen=1` — minimal UI; daily review default |
| Sec. 4 Progress | **Streak + best streak + 12-week contribution grid** (`src/lib/stats/study-activity.ts`, `StudyMomentumCard`) |
| Sec. 5 Library | **Deck sort**: **last opened** (default), most due, recently studied, recently added, mastery, A–Z (`DeckGrid`); home list ordered by **last opened** after enrichment |
| Sec. 8 Empty state | **First review banner** when decks exist with cards but `lastStudiedAt` is null |
| Sec. 3.2 Flip UX | **Spring-style flip** via Framer Motion on `Flashcard` |
| Ingestion tone | **`src/rules/cardProduction.rule.ts`** (imported in `generate-cards.ts`) nudges varied card types |
| Dashboard | **`/upload`** page (`UploadZone` + `UploadPageHero`), **Upload FAB**; **`lastOpenedAt`** on `Deck` (set when opening deck detail or review); **`GET /api/review/active`** resumes only **non-stale** active sessions (`finalizeStaleReviewSession`) |
| Sec. 9.8 Exam Countdown | **`ExamCountdown`** model; CRUD API (`/api/exams`); **readiness score** (`src/lib/exams/readiness.ts`); **`ExamCountdownCard`** on dashboard; **`/exams`** page; sidebar nav |
| YouTube recs | **`VideoRecommendation`** model; **YouTube Data API v3** (`src/lib/youtube/search.ts`); `POST /api/recommendations/youtube` (card-based); `POST /api/recommendations/search` (general query + optional deck); `GET /api/recommendations/recent`; button in `SessionComplete`; **`RecentVideosCard`** on dashboard; **`/videos`** page with search bar + deck selector + results grid; **"Videos"** sidebar nav |
| Landing page | **Combined hero + login** on `/login`; 60/40 split layout; brand hero with feature highlights; matching `/register` |
| Chat assistant | **`POST /api/chat`** — Gemini Q&A with optional deck context; **`ChatAssistant`** floating panel; deck selector |
| Fullscreen review | `/review/[deckId]` hides sidebar + dashboard chrome; `Sidebar` + `DashboardContent` check `isReviewRoute`; **browser Fullscreen API** auto-enters on session start + toggle button; sticky top bar with `backdrop-blur-md`; centered `max-w-3xl` flashcard area |

**Roadmap (not implemented):** FSRS, citation footnotes on cards, hallucination guard pass, concept heat map graph, ELI5 panic, audio mode, community decks — see phases in `flashcard_app_ideas.md` (section markers there may use “§” for historical notes; this file uses “Sec.” for readability).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, server components by default) |
| Database | Neon PostgreSQL |
| ORM | **Prisma** with `@prisma/adapter-neon` (serverless HTTP driver) |
| AI | Google Gemini API — model name is **`MODEL` in `src/lib/gemini/client.ts`** (currently `gemini-3-flash-preview`) via `@google/genai` |
| Auth | NextAuth.js v4 — JWT strategy, credentials provider |
| Styling | Tailwind CSS + custom CSS (globals.css) |
| Client UI state | [Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) — `src/stores/ui-store.ts` (sidebar + mobile nav; no provider required) |
| Local deck cache | [Dexie](https://dexie.org/docs/Tutorial/React) (IndexedDB) — `src/lib/local-db/decks-db.ts`, sync via `DeckLocalSync` + `syncDecksFromApi()`; reactive reads with `useLocalDecks()` (`dexie-react-hooks`) |
| PDF parsing | **Not used in upload** — PDF bytes are sent to Gemini as inline base64; `pdf-parse` may exist for other tooling |
| Motion | Framer Motion — card flip spring (`Flashcard`) |
| Stats | `src/lib/stats/study-activity.ts` — streaks from `ReviewLog` |
| Dashboard chrome | `DashboardBackdrop` — `bg-background` at `z-0`; **`SmoothFollower`** custom cursor (`z-[100]`, `pointer-events-none`, hides `body` cursor while mounted) |

---

## Project Structure

```
prisma/
  schema.prisma             # Source of truth for DB schema

src/
  generated/prisma/         # Auto-generated Prisma client (DO NOT EDIT)
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx            # Auth guard; DashboardBackdrop (bg + SmoothFollower + pointer layering)
      DashboardContent.tsx  # Main column + motion enter + UploadFab + ChatAssistant + DashboardServerRefresh
      page.tsx              # Home: streaks, stats, momentum, activity, deck grid, upload CTA, exams, videos
      upload/page.tsx       # Dedicated PDF upload (`UploadZone`)
      exams/page.tsx        # Exam countdown management page
      videos/page.tsx       # YouTube video search + recent recommendations
      videos/VideoSearchClient.tsx  # Client: search bar, deck selector, results grid
      decks/[id]/page.tsx   # Deck detail — calls touchDeckLastOpened
      review/
        page.tsx            # Review hub: all decks sorted by due count
        [deckId]/page.tsx   # Review session — fullscreen (sidebar hidden) + ReviewSession
    api/
      auth/
        [...nextauth]/route.ts   # NextAuth handler (GET + POST)
        register/route.ts        # POST — create new user
      upload/route.ts            # POST — PDF → AI → cards → deck
      chat/route.ts              # POST — Gemini chat (optional deck context)
      exams/
        route.ts                 # GET / POST — list + create exam countdowns
        [id]/route.ts            # PATCH / DELETE — update / remove exam
      decks/
        route.ts                 # GET  — list user's decks
        [id]/route.ts            # GET / PATCH / DELETE — single deck
      recommendations/
        youtube/route.ts         # POST — YouTube search for weak cards → save to DB
        search/route.ts          # POST — general YouTube search (query + optional deckId)
        recent/route.ts          # GET  — last 10 video recommendations
      review/
        session/route.ts         # GET  — load / create ReviewSession; ?mode=cram, ?fresh=1
        session/[id]/route.ts    # PATCH — persist queue + currentIndex
        submit/route.ts          # POST — single-card SM-2 (legacy)
        submit-batch/route.ts    # POST — apply queued ratings (batch)
        active/route.ts          # GET — resume tile + last-opened deck (excludes resume deck)
    globals.css
    layout.tsx              # Root layout — wraps with <Providers>
    providers.tsx           # "use client" SessionProvider wrapper
  stores/
    ui-store.ts             # Zustand: sidebar expanded, mobile drawer open
  lib/local-db/
    decks-db.ts             # Dexie database + LocalDeckRecord type
    sync-decks.ts           # syncDecksFromApi, upsertDeckFromUpload
  components/
    sync/DeckLocalSync.tsx  # Client: mirrors GET /api/decks → IndexedDB
    layout/DashboardBackdrop.tsx  # z-0 bg-background; z-[1] pointer-events-none shell; SmoothFollower on top
    layout/SmoothFollower.tsx       # Client-only lerp cursor (dot + ring); hover via elementFromPoint
    layout/Sidebar.tsx
    layout/UploadFab.tsx
    chat/ChatAssistant.tsx          # Floating Gemini chat panel with deck selector
    exam/ExamCountdownCard.tsx      # Dashboard countdown card + setup trigger
    exam/ExamSetupDialog.tsx        # Portal dialog to create exam countdown
    recommendations/VideoRecommendationsModal.tsx  # YouTube recs for weak cards
    dashboard/StatsBar.tsx
    dashboard/StudyMomentumCard.tsx  # streak + heatmap + FirstReviewBanner export
    dashboard/ReviewActivityCard.tsx
    dashboard/DashboardServerRefresh.tsx  # router.refresh on review activity events
    dashboard/UploadHomeCta.tsx
    dashboard/RecentVideosCard.tsx  # Horizontal scroll of recent YouTube recs
    deck/DeckGrid.tsx
    deck/CardList.tsx
    upload/UploadZone.tsx
    upload/UploadPageHero.tsx
    review/ReviewSession.tsx
    review/Flashcard.tsx
    review/RatingButtons.tsx
    review/SessionProgress.tsx
    review/SessionComplete.tsx
    progress/MasteryRing.tsx
  lib/
    auth.ts                 # NextAuth authOptions
    utils.ts                # cn(), formatRelativeDate(), getMasteryPercent(), etc.
    db/
      index.ts              # re-exports prisma + Prisma types
      prisma.ts             # PrismaClient singleton (Neon adapter)
      schema.ts             # Legacy Drizzle schema (UNUSED — kept for reference)
    gemini/
      client.ts             # GoogleGenerativeAI init, model exports
      generate-cards.ts     # PDF buffer (inline to Gemini) → GeneratedCard[]; inferDeckTitle
    pdf/
      parse.ts              # pdf-parse wrapper → { text, pages, filename }
    srs/
      sm2.ts                # SM-2 algorithm: calculateSM2, isMastered, getCardStatus, …
      mastery.ts            # countMasteredCards, computeMasteryProgressPercent, enrichDecksWithMasteryProgress
    exams/
      readiness.ts          # computeReadiness — readiness score, daily goal, status
    youtube/
      search.ts             # searchYouTube — YouTube Data API v3 wrapper
    stats/
      study-activity.ts     # Streaks + contribution from ReviewLog
    review/
      pending-ratings.ts    # Parse queue JSON for APIs
      finalize-stale-session.ts  # Mark active sessions completed/abandoned when not resumable
      activity-events.ts  # cardmind:review-activity-changed (client refresh)
    decks/
      touch-last-opened.ts
      sort-by-last-opened.ts
  types/
    next-auth.d.ts          # Extends Session to include user.id
```

---

## Database Schema (Prisma)

Schema lives in `prisma/schema.prisma`. Generated client in `src/generated/prisma/`.

### User
```
id           String   @id @default(uuid())
email        String   @unique
name         String?
passwordHash String?
image        String?
createdAt    DateTime
updatedAt    DateTime @updatedAt
```

### Deck
```
id             String    @id
userId         String    → User
title          String
description    String?
sourceFilename String?
emoji          String?   default "📚"
totalCards     Int       default 0
newCards       Int       default 0
dueCards       Int       default 0
masteredCards  Int       default 0
createdAt      DateTime
updatedAt      DateTime  @updatedAt
lastStudiedAt  DateTime?
lastOpenedAt   DateTime?  # set when user opens deck detail or review route
```

### Card
```
id           String    @id
deckId       String    → Deck (cascade delete)
front        String
back         String
tags         String[]
easeFactor   Float     default 2.5
interval     Int       default 0   (days)
repetitions  Int       default 0
dueDate      DateTime  default now()
lastReviewed DateTime?
createdAt    DateTime
```

### ReviewSession
```
id             String   @id
userId         String   → User
deckId         String   → Deck
cardIds        String[] — order for this study run
currentIndex   Int
pendingRatings Json     — queue before batch submit
status         String   active | completed | abandoned
lastActivityAt DateTime
```

### ExamCountdown
```
id        String    @id
userId    String    → User
deckId    String?   → Deck (nullable for global exams)
title     String
examDate  DateTime
dailyGoal Int       default 10
createdAt DateTime
```

### VideoRecommendation
```
id           String   @id
userId       String   → User
cardId       String   → Card
deckId       String   → Deck
videoId      String   YouTube video ID
title        String
channelName  String
thumbnailUrl String
videoUrl     String
createdAt    DateTime
```

### ReviewLog
```
id             String   @id
cardId         String   → Card (cascade delete)
userId         String   → User (cascade delete)
rating         Int      (0–5)
easeBefore     Float
intervalBefore Int
reviewedAt     DateTime default now()
```

---

## API Routes — Full Specification

All authenticated routes require a valid NextAuth JWT session cookie.
All responses follow `{ data } | { error }` shape.

---

### `POST /api/auth/register`
**Auth:** None  
**Body:** `{ name: string, email: string, password: string (min 8) }`  
**Returns:** `{ data: { id, email, name } }` — 201  
**Errors:** 409 duplicate email · 400 Zod validation · 500  
**Notes:** Hashes password with bcrypt (12 rounds). Lowercases email.

---

### `GET /api/auth/[...nextauth]`
### `POST /api/auth/[...nextauth]`
**Auth:** Managed by NextAuth  
**Notes:** JWT session strategy. Signs in via CredentialsProvider (email + bcrypt password check). Injects `user.id` into JWT and Session via callbacks.

---

### `POST /api/upload`
**Auth:** Required  
**Content-Type:** `multipart/form-data`  
**Field:** `file` — PDF, max 20MB  
**maxDuration:** 120 seconds  
**Flow:**
1. Validate file (extension, size)
2. `Promise.all([ inferDeckTitle(buffer, file.name), generateCardsFromPdf(buffer, file.name) ])` — both send the PDF to Gemini (see above)
3. `prisma.deck.create(...)` then `prisma.card.createMany(...)`  
**Returns:** `{ data: { deckId, title, cardCount } }`  
**Errors:** 400 no file / wrong type / too large · 422 no cards generated · 500

---

### `GET /api/decks`
**Auth:** Required  
**Query:** `?q=searchTerm` (optional, filters by title)  
**Flow:**
1. `prisma.deck.findMany({ where: { userId } })` ordered by `updatedAt desc`
2. `prisma.card.groupBy` by `deckId` where `dueDate <= now` **and** `repetitions > 0` (review queue only; brand-new cards are not “due” here)
3. Merges due count onto each deck, applies search filter  
4. **`enrichDecksWithMasteryProgress`** — one SQL aggregation (`SUM(LEAST(repetitions, 3))` per deck) adds **`masteryProgressPercent`** (0–100) for mastery **rings**; deck row **`masteredCards`** still comes from Prisma (count of cards with `repetitions >= 3`, updated by `updateDeckStats`)

**Returns:** `{ data: (Deck & { masteryProgressPercent: number })[] }`

---

### `GET /api/decks/[id]`
**Auth:** Required  
**Flow:** Verifies deck ownership. Returns deck + all cards + computed stats.  
**Returns:**
```json
{
  "data": {
    "deck": Deck,
    "cards": Card[],
    "stats": {
      "total": number,
      "due": number,
      "newCards": number,
      "mastered": number,
      "masteryProgressPercent": number
    }
  }
}
```
**Errors:** 404 not found / wrong user

---

### `PATCH /api/decks/[id]`
**Auth:** Required  
**Body:** `{ title?, description?, emoji? }` (all optional)  
**Returns:** `{ data: Deck }` — updated deck  
**Errors:** 404

---

### `DELETE /api/decks/[id]`
**Auth:** Required  
**Returns:** `{ data: { success: true } }`  
**Notes:** Prisma cascade deletes all cards and review logs.  
**Errors:** 404

---

### `GET /api/review/session`
**Auth:** Required  
**Query:** `?deckId=uuid` (required) · optional `?fresh=1` (abandon active sessions for deck, new queue) · `?mode=cram` (cram mode, up to 100 cards)

**Flow (summary):**
1. Verify deck ownership.
2. If `fresh` or `cram`: `updateMany` active sessions for that deck → `abandoned`.
3. If not fresh/cram: load latest **`status: active`** session for user+deck → **`finalizeStaleReviewSession`** (if `currentIndex >= len` and no pending ratings → `completed`; empty `cardIds` → `abandoned`). If still active, **resume**: return same `cardIds` order, `currentIndex`, `pendingRatings`, `sessionId`, `resumed: true`.
4. Otherwise **create** a new `ReviewSession` row: **normal** mode builds due+new mix (caps: 30 due, 15 new), shuffled; **cram** loads up to 100 cards for the deck, shuffled.
5. Returns `sessionId`, `cards`, `stats` (includes `mode`), `currentIndex`, `pendingRatings`, `resumed`.

**Returns:** `{ data: { sessionId, cards, stats, currentIndex, pendingRatings, resumed } }` — empty `cards` possible if nothing to study.

**Errors:** 400 missing deckId · 404 deck · 500

---

### `GET /api/review/active`
**Auth:** Required  
**Returns:** `{ data: { activeSession: null | { … }, recentDeck: null | { … } } }`  
- **`activeSession`:** latest user active session after **`finalizeStaleReviewSession`** (completed / abandoned sessions never returned). Includes `needsSubmit` when ratings are queued at end of queue.  
- **`recentDeck`:** user’s decks sorted by **`sortDecksByLastOpened`**, first deck **whose id ≠ active session’s deckId** (avoids duplicating the resume deck). Omits `lastOpenedAt` in JSON when null.

---

### `POST /api/review/submit`
**Auth:** Required  
**Body:** `{ cardId: uuid, rating: 0|1|2|3|4|5 }`  
**Flow:**
1. Fetch card by `cardId`
2. `calculateSM2({ easeFactor, interval, repetitions }, rating)` → new SM-2 state
3. `prisma.card.update(...)` — writes new easeFactor, interval, repetitions, dueDate, lastReviewed
4. `prisma.reviewLog.create(...)` — logs rating + before-state
5. `updateDeckStats(deckId)` (async, non-blocking) — recalculates totalCards, newCards, dueCards, masteredCards, lastStudiedAt  
**Returns:** `{ data: { sm2: { easeFactor, interval, repetitions, dueDate } } }`  
**Errors:** 400 Zod · 404 card not found · 500

---

### `POST /api/review/submit-batch`
**Auth:** Required  
**Body:** `{ sessionId: uuid }`  
**Flow:**
1. Loads active `ReviewSession` for the user; parses `pendingRatings` JSON queue
2. For each queued `{ cardId, rating }`, validates card belongs to session’s deck, applies `calculateSM2`, updates card, creates `ReviewLog`
3. Clears queue; sets session `status` to `completed` when the run is finished (`currentIndex >= cardIds.length` **or** full queue equals full deck queue — handles debounced PATCH edge cases)
4. **`await updateDeckStats(deckId)`** — recomputes `totalCards`, `newCards`, `dueCards`, `masteredCards`, `lastStudiedAt` from live cards
5. **`revalidatePath`** for `/`, `/review`, `/decks/[deckId]`, `/review/[deckId]` so App Router picks up fresh deck stats on navigation

**Returns:** `{ data: { applied, sessionComplete, submittedRatings } }`  
**Errors:** 400 nothing to submit / invalid queue · 404 session · 500

**Client:** `ReviewSession` calls this after PATCHing session state; on success it **`await syncDecksFromApi()`** (Dexie) and **`router.refresh()`** for both partial and completed sessions so the dashboard deck grid and completion indicators stay in sync.

---

### `POST /api/exams` / `GET /api/exams`
**Auth:** Required  
**POST Body:** `{ title: string, examDate: date (future), deckId?: uuid }`  
**POST Returns:** `{ data: ExamCountdown }` — 201  
**GET Returns:** `{ data: (ExamCountdown & { readiness: ReadinessResult })[] }` — sorted by exam date  
**Readiness:** `{ daysRemaining, readinessPercent, dailyGoal, status: on_track|behind|completed|overdue, message }`

---

### `PATCH /api/exams/[id]` / `DELETE /api/exams/[id]`
**Auth:** Required (owner only)  
**PATCH Body:** `{ title?, examDate?, deckId? }`  
**DELETE Returns:** `{ data: { success: true } }`

---

### `POST /api/recommendations/youtube`
**Auth:** Required  
**Body:** `{ cardIds: uuid[] }` (1–10)  
**Flow:** Load each card's text → search YouTube Data API v3 → save `VideoRecommendation` rows  
**Returns:** `{ data: { recommendations: VideoRecommendation[] } }`

---

### `POST /api/recommendations/search`
**Auth:** Required  
**Body:** `{ query?: string, deckId?: uuid }`  
**Flow:** If `deckId`, appends deck title + "study tutorial explanation" to query. Searches YouTube Data API v3 for up to 9 results. Does **not** save to DB (user browses first).  
**Returns:** `{ data: { videos: YouTubeVideo[] } }`

---

### `GET /api/recommendations/recent`
**Auth:** Required  
**Returns:** Last 10 `VideoRecommendation` for the user with `card.front` context

---

### `POST /api/chat`
**Auth:** Required  
**Body:** `{ messages: { role: "user"|"model", content: string }[], deckId?: uuid }`  
**Flow:** If `deckId`, loads deck cards as system context. Calls Gemini with full conversation history.  
**Returns:** `{ data: { reply: string } }`

---

## SM-2 Algorithm (`src/lib/srs/sm2.ts`)

```
Input:  { easeFactor, interval, repetitions } + rating (0–5)
Output: { easeFactor, interval, repetitions, dueDate }

New easeFactor = max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

rating < 3  → reset: interval = 1, repetitions = 0
rating ≥ 3  →
  repetitions === 0  → interval = 1
  repetitions === 1  → interval = 6
  repetitions  >= 2  → interval = ceil(interval * easeFactor)
  repetitions += 1

dueDate = midnight of (today + interval days)
```

**“Mastered” card (deck aggregates + `isMastered`):** `repetitions >= 3` in the current streak. Ease is **not** part of this gate (repeated “Hard” passes can push ease below 2.0 while repetitions is still ≥ 3).

**Mastery ring (UI progress):** `computeMasteryProgressPercent` / `enrichDecksWithMasteryProgress` — each card contributes `min(repetitions, 3)` steps out of `3 × totalCards`, so the ring moves after the first successful session, not only when every card hits three passes.

**Exported helpers:**
- `calculateSM2(card, rating)` → SM2Result
- `getNextReviewLabel(rating, card)` → human string ("1 day", "3w", etc.)
- `isDue(dueDate)` → boolean
- `isMastered(card)` → boolean
- `getCardStatus(card)` → "new" | "learning" | "review" | "mastered"

---

## Gemini Integration (`src/lib/gemini/`)

**SDK:** `@google/genai` (`GoogleGenAI`) — not the legacy `@google/generative-ai` package.

**Model:** Single source of truth — **`export const MODEL` in `src/lib/gemini/client.ts`**.  
The repo may use a **preview** model id (e.g. `gemini-3-flash-preview`); swap it there for upgrades/downgrades. **`GEMINI_API_KEY` is required** at startup (`client.ts` throws if missing).

### Client (`src/lib/gemini/client.ts`)
```typescript
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export const MODEL = "gemini-3-flash-preview"; // change here only
```

### Card generation (`generateCardsFromPdf`)

PDFs are sent **once** as **inline base64** — no chunking, no `pdf-parse` in this path.

```
pdfBuffer (Buffer)
  → base64
  → ai.models.generateContent({ model: MODEL, contents: [{ parts: [ inlineData PDF, text prompt ] }] })
  → response.text
  → parse JSON array (regex /\[[\s\S]*\]/)
  → validate front/back, dedupe by first 60 chars of front (case-insensitive)
  → slice(0, 60) max cards per deck
```

**Prompt:** Prepends **`src/rules/cardProduction.rule.ts`** (`CardProductionRule`) and asks for **15–50** cards; implementation still caps at **60** after dedupe.

**Retries:** Loop `0..retries` (default **2** retries after first attempt). On **429** (`RESOURCE_EXHAUSTED`), uses **`getRetryDelayMs`** to parse API `retryDelay` when present, else backoff; non-429 uses **1500 × attempt** ms. Returns **`[]`** on total failure so upload can return 422 without crashing.

### Title inference (`inferDeckTitle`)

Same PDF inline pattern; asks for JSON `{"title","emoji"}`. Parses with `/\{[\s\S]*?\}/`. Retries with similar 429 handling; **fallback:** filename stem + 📚.

### Upload route (`POST /api/upload`)

Parallel calls (no `pdf-parse`):

```typescript
const [{ title, emoji }, generatedCards] = await Promise.all([
  inferDeckTitle(buffer, file.name),
  generateCardsFromPdf(buffer, file.name),
]);
```

---

## Auth Flow

1. User submits email + password to `POST /api/auth/callback/credentials` (via NextAuth)
2. `authorize()` in `authOptions` fetches user from Prisma, verifies bcrypt hash
3. On success → JWT created with `{ id, email, name }`
4. `session.user.id` available in all server components via `getServerSession(authOptions)`
5. Dashboard layout (`(dashboard)/layout.tsx`) redirects to `/login` if no session

---

## Key Development Patterns

### Auth guard in server pages
```typescript
const session = await getServerSession(authOptions);
const userId = session!.user.id; // layout already redirected if null
```

### Prisma client — always import from `@/lib/db`
```typescript
import { prisma } from "@/lib/db";
// Never import directly from @/generated/prisma
```

### API response shape
```typescript
return NextResponse.json({ data: result });       // success
return NextResponse.json({ error: "..." }, { status: 4xx });  // error
```

### Deck stat updates after review
- **Legacy `POST /api/review/submit`** (single card): may fire `updateDeckStats` without blocking the JSON response (same idea as before).
- **Batch flow (`submit-batch`)**: server **awaits** `updateDeckStats` before responding, then **revalidates** dashboard/review/deck paths. The review UI always refreshes local Dexie + RSC after a successful batch so home and deck pages show updated due/mastered counts immediately.
- **`updateDeckStats`** uses **`countMasteredCards`** from `src/lib/srs/mastery.ts` (same rule as `isMastered` in `sm2.ts`).

### Mastery display
- **`masteredCards`** on `Deck`: number of cards with **`repetitions >= 3`** (persisted).
- **`masteryProgressPercent`**: computed on list/home/review hub for **rings**; not a DB column.

---

## Environment Variables

```bash
DATABASE_URL=           # Neon connection string (postgres://...)
GEMINI_API_KEY=         # Google AI Studio key
YOUTUBE_API_KEY=        # YouTube Data API v3 key (for video recommendations)
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=           # http://localhost:3000 in dev
```

---

## Commands

```bash
npm run dev             # Start dev server (localhost:3000)
npm run build           # Production build
npx prisma db push      # Push schema changes to Neon
npx prisma studio       # Visual DB browser
npx prisma generate     # Regenerate client after schema changes
```

---

## Agent / dev memory

### Tailwind + `globals.css` (fixed 2026-04-09)

`src/app/globals.css` uses shadcn-style `@apply border-border`, `bg-background`, `text-foreground`, etc. Those require semantic colors in **`tailwind.config.ts`** (`border`, `background`, `foreground`, `primary`, … as `hsl(var(--…))`). CSS variables in `:root` alone are not enough — without theme entries, PostCSS fails with “class does not exist” (e.g. `border-border`). See `theme.extend.colors` and `borderRadius` in `tailwind.config.ts`.

### Windows PowerShell notes

When running shell commands on this machine, prefer patterns that work in **PowerShell** (especially 5.1 on Windows):

- **Chaining:** `cmd1 && cmd2` works in **PowerShell 7+**; in **Windows PowerShell 5.1** use `cmd1; if ($?) { cmd2 }` or run commands separately. Use `;` to sequence when `&&` is unavailable.
- **Environment variables:** Bash `export FOO=bar` does not apply — use `$env:FOO = "bar"` (session) or set user/machine env in System Properties.
- **Removing directories:** Prefer `Remove-Item -Recurse -Force path` over `rm -rf` if the latter behaves differently.
- **Paths:** Quote paths with spaces, e.g. `cd "D:\PROGRAMMING\Projects 2026\pdfcardmaker"`.

Keep one-off “this failed on PowerShell” notes here so future sessions avoid repeating the same friction.

### Dashboard backdrop + custom cursor

- **`DashboardBackdrop`**: **`fixed` full-viewport `bg-background` at `z-0`**. The shell wrapping `{children}` uses **`pointer-events-none`** at `z-[1]` so it does not block the page. **`Sidebar`** and **`DashboardContent`** opt in with **`pointer-events-auto`**.
- **`SmoothFollower`**: rendered above chrome (`z-[100]`), **`pointer-events-none`**, lerp animation for dot + ring; **`elementFromPoint` + `closest(...)`** enlarges the ring on interactive targets (no static `querySelectorAll` at mount). **`document.body.style.cursor = "none"`** while mounted — restored on unmount when leaving the dashboard layout.

---

## Do Not

- Never import `PrismaClient` directly — use `prisma` from `@/lib/db`
- Never skip Zod validation on API inputs
- Never let `easeFactor` drop below 1.3 in SM-2
- Never expose `passwordHash` in any response
- Never edit files in `src/generated/prisma/` — run `prisma generate` instead
- Never add auth logic to the demo/test pages — all auth is in `(dashboard)/layout.tsx`
