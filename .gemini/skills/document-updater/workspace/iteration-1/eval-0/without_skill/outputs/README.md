# CardMind — Smart Flashcards from PDFs

Turn any PDF into a practice-ready flashcard deck powered by Gemini AI and SM-2 spaced repetition.

## Features

- **AI Card Generation** — Gemini 1.5 Flash reads your PDF directly (no pre-extraction needed) and creates 15-60 high-quality flashcards across 5 specialized types:
  - **DEFINITION** — Key term to precise, example-supported definition.
  - **CONCEPT** — Plain-language explanations of core ideas.
  - **RELATIONSHIP** — Comparison, contrast, or cause-effect between concepts.
  - **APPLICATION** — Step-by-step worked problems or "What happens when..." scenarios.
  - **EDGE CASE** — Common mistakes and misconceptions.
- **SM-2 Spaced Repetition** — Cards you know fade; cards you struggle with keep showing up.
- **Beautiful Review UI** — Flip cards, rate 0-5, keyboard shortcuts, session progress.
- **Mastery Tracking** — See exactly what you've mastered, what's shaky, what's due.
- **Deck Management** — Browse, search, revisit all your decks.

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd pdfcardmaker
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root and fill in your values:

```bash
DATABASE_URL=           # Neon PostgreSQL connection string (using @prisma/adapter-neon)
GEMINI_API_KEY=         # Google AI Studio key
NEXTAUTH_SECRET=        # Generate with `openssl rand -base64 32`
NEXTAUTH_URL=           # http://localhost:3000 in dev
```

### 3. Push database schema

```bash
npm run db:push
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, Server Components) |
| Database | Neon PostgreSQL (Serverless HTTP) |
| ORM | **Prisma** with `@prisma/adapter-neon` |
| AI | Google Gemini 1.5 Flash (`@google/genai`) |
| Auth | NextAuth.js v4 (JWT + Credentials strategy) |
| Styling | Tailwind CSS + Framer Motion |

## Project Structure

```
prisma/               # Database schema (Prisma)
src/
  app/                # App Router (Pages, Layouts, API Routes)
  components/         # UI components (Deck, Review, Dashboard, Layout)
  lib/
    db/               # Prisma client singleton & database utils
    gemini/           # AI pipeline (Card generation, Title inference)
    pdf/              # Legacy PDF parsing (pdf-parse)
    srs/              # SM-2 algorithm implementation
    auth.ts           # NextAuth configuration
  types/              # TypeScript definitions & type extensions
```

## Spaced Repetition

Uses the **SM-2 algorithm** for calculating optimal review intervals:
- Rate each card 0 (blackout) → 5 (perfect) after review.
- Cards rated < 3 reset (repetitions set to 0, interval set to 1 day).
- Cards rated ≥ 3 get increasingly longer intervals based on `easeFactor`.
- **Mastery:** A card is considered "mastered" after achieving 3+ successful reviews and an ease factor ≥ 2.0.

## License

MIT
