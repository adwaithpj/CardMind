# CardMind — Smart Flashcards from PDFs

Turn any PDF into a practice-ready flashcard deck powered by Gemini AI and SM-2 spaced repetition.

## Features

- **AI Card Generation** — Gemini reads your PDF and creates 15-60 high-quality flashcards (definitions, concepts, examples, edge cases)
- **SM-2 Spaced Repetition** — Cards you know fade; cards you struggle with keep showing up
- **Beautiful Review UI** — Flip cards, rate 0-5, keyboard shortcuts, session progress
- **Mastery Tracking** — See exactly what you've mastered, what's shaky, what's due
- **Deck Management** — Browse, search, revisit all your decks

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd pdfcardmaker
npm install
```

### 2. Set up environment variables

Copy `.env.local` and fill in your values:

```bash
cp .env.local .env.local
```

Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/) key
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` in dev

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
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| AI | Google Gemini 1.5 Flash (`@google/genai`) |
| Auth | NextAuth.js v4 |
| Styling | Tailwind CSS |

## Spaced Repetition

Uses the **SM-2 algorithm**:
- Rate each card 0 (blackout) → 5 (perfect) after review
- Cards rated < 3 reset (seen again tomorrow)
- Cards rated ≥ 3 get increasingly longer intervals
- Mastered = 3+ successful reviews with ease factor ≥ 2.0

## License

MIT
