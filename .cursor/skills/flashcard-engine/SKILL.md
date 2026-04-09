---
name: flashcard-engine
description: >-
  Build and maintain the PDF Flashcard Engine — a Next.js app that converts PDFs
  into smart flashcard decks using Gemini AI and SM-2 spaced repetition.
  Use when working on card generation prompts, SM-2 algorithm, review sessions,
  Neon database schema, Gemini API integration, or any feature of this app.
---

# PDF Flashcard Engine — Developer Skill

## Stack at a Glance

- **Next.js 15** App Router — server components by default
- **Neon PostgreSQL** + **Drizzle ORM** — edge-compatible via `@neondatabase/serverless`
- **Gemini API** (`gemini-1.5-pro`) — PDF parsing + card generation
- **Tailwind CSS** + **shadcn/ui** — styling
- **NextAuth.js** — authentication

See [GEMINI.md](../../../GEMINI.md) for full architecture reference.

## SM-2 Spaced Repetition

Located in `src/lib/srs/sm2.ts`. Key rules:

- Ratings: 0 (blackout) → 5 (perfect)
- Ratings < 3 reset the card (interval back to 1 day)
- `new_ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`, min EF = 1.3
- Intervals: rep 0 → 1 day, rep 1 → 6 days, rep n → `ceil(interval * ef)`
- `due_date` stored as UTC date; cards with `due_date <= now()` are reviewable

## Gemini Card Generation

Located in `src/lib/gemini/generate-cards.ts`.

**Chunking strategy**: Split PDF text into ~3000-token chunks by paragraph boundaries. Generate cards per chunk, then deduplicate by semantic similarity.

**Card types to request** (include in system prompt):
1. Definition — term → precise definition
2. Concept — plain-language explanation
3. Relationship — how concepts connect
4. Application — worked example or problem
5. Edge case — common misconception or trap

**Output schema** (always validate before DB insert):
```typescript
{ front: string; back: string; tags: string[] }[]
```

**Quality threshold**: If Gemini returns < 5 cards for a chunk, retry with a more detailed prompt.

## Database Patterns

```typescript
// Always use prepared statements for performance
const dueCards = await db
  .select()
  .from(cards)
  .where(and(
    eq(cards.deckId, deckId),
    lte(cards.dueDate, new Date())
  ))
  .orderBy(asc(cards.dueDate))
  .limit(20);
```

Key columns on `cards` table:
- `easeFactor` (default 2.5, min 1.3)
- `interval` (days, default 0)
- `repetitions` (count, default 0)
- `dueDate` (timestamp, default now)
- `lastReviewed` (timestamp, nullable)

## Review Session Flow

1. `GET /api/review/[deckId]/session` — fetch up to 20 due cards + 10 new cards
2. User flips card → self-rates 0-5
3. `POST /api/review/submit` — body: `{ cardId, rating }` → updates SM-2 fields, logs to `review_logs`
4. Session ends → show stats (cards reviewed, average rating, mastered count)

## UI Component Patterns

**Flashcard flip**: CSS 3D transform (`rotateY(180deg)`) with `perspective`. Front = question, Back = answer + rating buttons.

**Rating buttons**: 4 options (Again=0, Hard=2, Good=3, Easy=5). Show estimated next review time below each button.

**Mastery ring**: Circular SVG progress ring. Color: red < 40%, yellow 40-70%, green > 70%.

**Deck card**: Shows title, card count, due count badge (red), last studied date, mastery %.

## API Route Conventions

```typescript
// app/api/decks/route.ts
export async function GET(request: Request) { ... }  // list decks
export async function POST(request: Request) { ... } // create deck

// app/api/decks/[id]/route.ts
export async function GET(...)    // get deck + cards
export async function PATCH(...)  // update deck
export async function DELETE(...) // delete deck
```

Always return `{ data, error }` shape. Use `NextResponse.json()`.

## PDF Upload Flow

1. Client: `FormData` POST to `/api/upload`
2. Server: extract text via `pdf-parse`
3. Chunk text → send to Gemini → receive cards JSON
4. Validate + insert cards → return deck ID
5. Client: redirect to `/decks/[id]`

Show upload progress via Server-Sent Events or optimistic UI with polling.

## Common Pitfalls

- **Neon cold starts**: Use `@neondatabase/serverless` with `neon()` HTTP driver for Edge/Serverless, not `pg` Pool
- **Gemini rate limits**: Implement exponential backoff; `gemini-1.5-pro` has 2 RPM on free tier
- **PDF text quality**: Run basic cleanup (remove multiple whitespace, headers/footers pattern) before sending to Gemini
- **SM-2 edge**: Never let `easeFactor` drop below 1.3 or interval below 1 day

## Additional Resources

- Full schema: `src/lib/db/schema.ts`
- SM-2 implementation: `src/lib/srs/sm2.ts`
- Gemini prompts: `src/lib/gemini/generate-cards.ts`
- Full architecture: `GEMINI.md` (project root)
