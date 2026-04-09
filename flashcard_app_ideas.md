# 🧠 Flashcard App — Full Design & Ideas Document

> "Cards that feel like they were written by a great teacher, not scraped by a bot."

---

## 0. The North Star

The goal isn't a flashcard app. The goal is a **memory operating system** — one that ingests any piece of knowledge, understands it, and systematically burns it into long-term memory while feeling like a game you want to keep playing.

Every decision flows from two questions:
1. Does this make the cards *smarter*?
2. Does this make the student *come back tomorrow*?

---

## 1. Ingestion — Making Cards That Actually Teach

### 1.1 Semantic Parsing, Not Scraping
Most tools chunk text and prompt GPT. Don't. Build a **Concept Extraction Pipeline**:
- Extract **entities** (terms, names, dates, formulas)
- Extract **relationships** (X causes Y, X is a type of Y, X contrasts with Y)
- Extract **worked examples** and **edge cases** separately
- Assign each extracted concept a **difficulty score** based on abstraction level

> A paragraph on Newton's laws shouldn't yield "What is Newton's 1st Law?" — it should yield "A hockey puck is sliding on a frictionless surface. What force is required to maintain its speed?" paired with "What breaks this assumption in real life?"

### 1.2 Card Types — A Full Taxonomy
Don't generate only Q&A pairs. Generate a mix:

| Type | When to Use | Example |
|---|---|---|
| **Cloze (fill-in-blank)** | Definitions, key terms | "The pH of a neutral solution is ___" |
| **Multiple Choice** | First exposure, concept discrimination | "Which of these is NOT a property of..." |
| **Free Recall** | After 2+ correct MCQ answers | "Explain photosynthesis in your own words" |
| **Scenario-Based** | Applied, relational concepts | "You're a doctor and patient presents with X..." |
| **True/False + Justify** | Common misconceptions | "Correlation implies causation. True or false? Explain." |
| **Ordering / Sequencing** | Processes, timelines | "Arrange the steps of mitosis in order" |
| **Diagram Labeling** | Visual concepts | Show unlabeled diagram, user labels parts |
| **Analogy Completion** | Abstract concepts | "RAM is to a computer as ___ is to a kitchen" |
| **Socratic Prompt** | High mastery level | "What would happen if [constraint] were removed?" |

### 1.3 Progressive Overload (Card Evolution)
Cards **mutate** based on performance:

```
Exposure 1  →  Multiple Choice (scaffolded, 4 options)
Exposure 2  →  Cloze / Fill-in-blank
Exposure 3  →  Free Recall
Exposure 4+ →  Scenario / Application / Socratic
```

The student never sees the same format twice in a row unless they're struggling.

### 1.4 Micro-Deck Slicing
A 60-page chapter shouldn't become one monolithic deck. Auto-slice into:
- **5–10 concept clusters** with logical boundaries
- Each micro-deck: 8–15 cards
- Students can tackle one micro-deck in a single 10-minute session

Label them clearly: "Chapter 3 — Part 2: Enzyme Kinetics" not just "Bio Cards Set 4"

### 1.5 Hallucination Guard
LLMs will confidently generate wrong facts. Mitigate with:
- **Citation anchoring**: Every card back includes the source sentence/page it was derived from (shown as a small footnote, tappable to view context)
- **Low temperature** on generation prompts (0.2–0.4)
- **Fact-check pass**: A second LLM call that reads the card and says "is this accurate given this source excerpt?" and flags uncertain cards
- Flagged cards show a small ⚠️ icon and go into a human-review queue or are shown with a disclaimer

### 1.6 Multimodal PDF Handling
Standard text parsers break on:
- LaTeX formulas
- Tables
- Charts and diagrams
- Multi-column layouts

Solution: **Vision-first parsing** — render each PDF page as an image, pass to a vision model, then extract structured content. For formulas, use MathJax rendering on the card itself.

---

## 2. Spaced Repetition — The Engine

### 2.1 Algorithm Options

**SM-2 (Anki's algorithm)** — Battle-tested, free, works:
- After each review, user rates: Again / Hard / Good / Easy (1–4)
- Algorithm computes next interval and ease factor
- Stable, predictable, well-documented

**FSRS (Free Spaced Repetition Scheduler)** — Modern, better:
- Uses ML-derived memory model
- Predicts retrievability as a continuous value (0–1)
- Outperforms SM-2 in retention studies
- Open source: `open-spaced-repetition/fsrs`
- **Recommend implementing FSRS** — it's the current state-of-the-art

**Your own twist — "Confidence Decay Model"**:
- Track *how long* a student takes to answer (response latency)
- Fast + correct = high confidence → longer interval
- Slow + correct = shaky confidence → shorter interval than SM-2 would give
- Augment FSRS with latency as a modifier

### 2.2 Smart Scheduling
- Show **new cards** in the morning session, **review cards** in the evening
- Detect user's **peak study hours** from history and suggest sessions then
- **Vacation Mode**: If inactive for 5+ days, detect and offer a "Soft Reset" — reviews rescheduled over 7 days, not dumped all at once
- **Daily cap**: Never show more than N reviews + M new cards per session. User-configurable, but default to sane limits (e.g., 20 reviews + 5 new)

### 2.3 Review Hell Prevention
The biggest churn cause in flashcard apps. Solutions:
- **Backlog smoothing**: If backlog > 3x daily limit, spread it across upcoming days automatically
- **Triage Mode**: When backlog is huge, show the 20 "most overdue" cards only — don't show the full count
- **Skip without penalty**: Allow users to snooze a session without it counting as failure. Add to next day, not the same day × 2

---

## 3. The Learning Session — UX Deep Dive

### 3.1 Session Modes

| Mode | Use Case |
|---|---|
| **Daily Review** | The default — FSRS-scheduled cards |
| **Cram Mode** | Exam tomorrow — show all cards, ignore scheduling |
| **Weak Spots Only** | Only cards rated Again/Hard in last 7 days |
| **Speed Run** | 60-second timer per card, gamified |
| **Zen Mode** | No score, no timer, just cards. For re-reading. |
| **Audio Mode** | TTS reads the card, user speaks or taps answer |

### 3.2 The Card Flip — More Than Animation
The card flip moment is the core interaction. Make it feel like something:
- **Physical spring physics** on the flip (not a CSS linear flip)
- **Sound design**: A subtle, satisfying "click" on flip
- **Color shift**: Card back has a different tint — warm tones for answered correctly, cool for reviewing
- After answer revealed: slide rating buttons in from below like a bottom sheet — don't just show 4 ugly buttons

### 3.3 Self-Rating vs. Auto-Grading
For free recall / typed answers:
- Don't do exact string matching — use semantic similarity
- Pass the user's answer + correct answer to LLM: "Did the student demonstrate understanding? Yes/Partial/No"
- Show them the ideal answer, let them confirm their own rating
- Option: Accept voice input, transcribe, then grade semantically

---

## 4. Progress & Mastery — Make It Feel Real

### 4.1 The Knowledge Heat Map
Replace boring progress bars with a **concept graph**:
- Each concept extracted during ingestion becomes a **node**
- Nodes are colored by mastery: Red → Orange → Yellow → Green
- Edges show relationships (e.g., "Entropy" → "Second Law of Thermodynamics")
- As you review, watch your graph light up
- Tap any node to review cards for that concept only

This is the single most motivating visualization you can build. Make it the home screen.

### 4.2 The Mastery Timeline
A GitHub-style contribution graph, but for study sessions:
- Each day = a square
- Color intensity = cards reviewed that day
- Streak tracking with fire emoji
- "Best streak: 21 days" prominently shown

### 4.3 Forgetting Curve Visualizer
Show the student their predicted retention curve for a deck:
- X axis: time
- Y axis: % likely to recall correctly
- Current moment marked with a vertical line
- Show when retention will drop below 80% if they don't review
- This makes the urgency of reviewing *visceral*, not abstract

### 4.4 Weekly Digest (Push / Email)
Every Sunday:
- "You reviewed 147 cards this week"
- "3 concepts moved from Shaky → Mastered"
- "Your weakest topic: Enzyme Inhibition — review it?"
- Designed like a magazine infographic, not a wall of text

### 4.5 Mastery Certificates
When all cards in a deck reach mastered status:
- Full-screen celebration animation
- Generate a shareable "I mastered X" card (like a Spotify Wrapped card)
- Option to archive the deck or keep reviewing at extended intervals

---

## 5. Deck Management — At Scale

### 5.1 The Library View
- Grid of decks with cover images (auto-generated from topic: a chemistry deck gets a molecule aesthetic)
- Each deck shows: card count, mastery %, next review due
- Sort by: Most Due, Recently Studied, Recently Added, Lowest Mastery
- Search with instant fuzzy filtering

### 5.2 Deck Organization
- **Tags**: User-applied (e.g., "Semester 1", "Midterm", "Work")
- **Auto-tagging**: Based on subject detected during ingestion (AI assigns "Biology > Genetics" etc.)
- **Smart Folders**: "Due Today", "Not Started", "Mastered", auto-populated
- **Collections**: Group multiple decks (e.g., "GATE 2026 Prep" containing 12 sub-decks)

### 5.3 Collaborative Decks
- Share a deck via link → recipient gets a copy in their library
- "Based on deck by @adwaith" attribution
- Upvote / fork system (like GitHub for knowledge)
- Featured community decks for popular subjects (JEE, UPSC, GATE, NEET)

### 5.4 Version Control for Decks
When the source PDF is updated, or when you want to add more cards:
- Re-upload → system diffs new cards vs existing
- Merges new cards, keeps your review history for existing ones
- Shows you a "5 new cards added" changelog

---

## 6. The Delight Layer — What Makes It Unforgettable

### 6.1 Cinematic Focus Mode
When a session starts, the app transitions into a full-screen study environment:
- Dark, immersive, distraction-free
- Ambient background: subtle animated gradient that shifts based on subject (Chemistry = cool blues, History = warm sepia, Math = deep indigo)
- Option: lofi beats auto-curated by topic (via YouTube/Spotify embed)
- Typography becomes large, centered, cinematic — not a browser form

### 6.2 The "ELI5" Panic Button
If a card is rated "Again" 3+ times:
- A pulsing "🆘 I'm lost" button appears
- Tap it: AI rewrites the concept using an analogy at 5th-grade reading level
- Shows alongside the original explanation
- "Did this help? Yes / Still lost" — feeds back into card generation

### 6.3 Streak Shields
Anki-inspired but more generous:
- Earn "Streak Shields" by completing sessions (1 per 7-day streak)
- If you miss a day, a shield absorbs it — streak preserved
- Shields shown as actual collectible icons, not just a counter
- Encourages building the habit, forgives the occasional miss

### 6.4 "The Blur Test"
A fun, optional challenge:
- Card answer is shown blurred
- Student tries to recall before unblurring
- Gamified: score based on how few characters were unblurred before they got it right
- Creates a game out of trying to recall

### 6.5 Boss Cards
At the end of each micro-deck's review session: a "Boss Card":
- A hard, synthesis-level question that combines 3+ concepts from the deck
- "You reviewed 12 cards today. Can you defeat the Boss?"
- If answered correctly: animated win sequence
- If wrong: "The Boss will return tomorrow"

### 6.6 Memory Snapshots
Before a major exam, generate a "Memory Snapshot Report":
- Which concepts are solid
- Which are shaky and need one more pass
- Estimated time to get all cards to 80%+ retention
- Exportable as a PDF study guide

---

## 7. Architecture — How to Actually Build This

### 7.1 High-Level System Design

```
[Client: Next.js]
    ↕ REST / WebSocket
[API Gateway: NestJS]
    ├── Auth Service (JWT, RS256, HttpOnly cookies)
    ├── Deck Service (CRUD, scheduling, review sessions)
    ├── Card Service (generation, evolution, rating)
    └── Analytics Service (mastery, streaks, heatmap)
         ↕
[AI Microservice: FastAPI + LangChain/LlamaIndex]
    ├── PDF Parser (vision model + text extraction)
    ├── Card Generator (concept extraction → card types)
    ├── Answer Grader (semantic similarity scoring)
    └── ELI5 Generator (simplification on demand)
         ↕
[Database: PostgreSQL + Prisma]
[Cache: Redis (session state, file hash cache)]
[Storage: S3 / Cloudflare R2 (PDFs, images)]
```

### 7.2 Key Database Schema

```
User
  ├── Deck[]
  ├── StudySession[]
  └── Settings (daily limit, timezone, notification prefs)

Deck
  ├── sourceFile (S3 key)
  ├── sourceHash (MD5 for dedup)
  ├── MicroDeck[]
  └── Tag[]

Card
  ├── front (question)
  ├── back (answer)
  ├── cardType (MCQ | cloze | freeRecall | scenario)
  ├── conceptTags[]
  ├── sourcePageRef (page + paragraph)
  ├── isFlagged (hallucination check)
  └── ReviewLog[]

ReviewLog
  ├── userId
  ├── cardId
  ├── rating (1–4)
  ├── responseLatencyMs
  ├── timestamp
  └── nextReviewAt (FSRS output)
```

### 7.3 Cost Optimization

- **File hashing**: MD5 the uploaded file. If hash exists in DB, serve cached deck. No LLM call.
- **Batch generation**: Don't generate cards one by one. Extract all concepts first, then generate all cards in one large batched prompt.
- **Model tiering**: Use a cheaper model (Haiku/Flash) for answer grading and ELI5. Reserve expensive models (Sonnet/GPT-4o) only for initial card generation.
- **CDN for static assets**: Host card assets, images on Cloudflare.
- **Lazy enrichment**: Only generate scenario/Socratic cards when a user reaches mastery level, not upfront.

### 7.4 Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR for initial load, React for interactivity |
| Styling | Tailwind + Framer Motion | Utility classes + smooth animations |
| State | Zustand or Redux Toolkit | Lightweight for card session state |
| Backend | NestJS | Modular, typed, scales cleanly |
| ORM | Prisma + PostgreSQL | Type-safe relational queries |
| AI Service | FastAPI + LlamaIndex | Purpose-built document Q&A pipeline |
| SRS Algorithm | FSRS (open-source) | Best modern algorithm, open-spec |
| Auth | JWT (RS256) + HttpOnly cookies | Already in your stack |
| Storage | Cloudflare R2 | Cheaper than S3, S3-compatible API |
| Cache | Redis | File hash dedup + session cache |

---

## 8. Pitfalls — What Will Actually Break You

### 8.1 Review Hell (The #1 Churn Killer)
If users skip 5 days, they return to 400 due cards. They close the app and never return.
- **Fix**: Daily cap is sacred. Never exceed it no matter the backlog.
- **Fix**: "Smooth Catch-Up" spreads backlog over N days (configurable)
- **Fix**: Show "Your top 10 cards for today" not "You have 400 overdue"

### 8.2 Bad Card Quality Destroying Trust
One confidently wrong card and the user questions everything.
- **Fix**: Citation footnote on every card. Tap to see source.
- **Fix**: Automatic fact-check pass during generation.
- **Fix**: User flag system — "Report this card" → human review queue.
- **Fix**: Cards generated from OCR-mangled text should be quarantined pending review.

### 8.3 PDF Parsing Failures
Tables → garbled text. Formulas → "∫∂x". Scanned PDFs → nothing.
- **Fix**: Vision-model page rendering for all PDFs, not text extraction only.
- **Fix**: MathJax rendering for all formula-containing cards.
- **Fix**: User feedback loop: "Was this card generated correctly?" with a quick Yes/No.

### 8.4 The Empty State Problem
A new user uploads their first PDF. Cards are generated. Now what? They stare at a deck with no guidance.
- **Fix**: Onboarding flow — guided first session after first upload.
- **Fix**: "Start your first review" CTA with a session preview ("12 cards, ~8 minutes").
- **Fix**: The first session should feel great — curate the experience, don't just dump all 12 cards.

### 8.5 Notification Fatigue
Daily reminders that get ignored → users disable them → they forget the app exists.
- **Fix**: Adaptive notifications — if a user always studies at 8pm, remind at 7:45pm only.
- **Fix**: Skip reminders when the user already studied that day.
- **Fix**: Vary the notification copy — not "Time to study!" every single day.

### 8.6 Free-Recall Grading Edge Cases
User writes a correct answer in different words → marked wrong → frustration.
- **Fix**: Semantic similarity scoring, not string matching.
- **Fix**: Always show the ideal answer after grading — let user override with "I was right".
- **Fix**: Log overrides — if a card gets overridden 3+ times, the answer threshold is probably too strict. Auto-adjust.

---

## 9. New Ideas Not On Your List

### 9.1 The "Pre-Lecture" Mode
Upload the textbook chapter *before* class. App generates a "priming deck" — not full cards, but 5 key questions to hold in mind during the lecture. After class, you come back and answer them. Turns passive listening into active recall.

### 9.2 Mistake Pattern Analysis
Track *why* cards are failed. Cluster common mistakes:
- "You frequently confuse X with Y — here's the distinction"
- "You understand the concept but misapply it in scenarios"
- "You know the definition but not the edge cases"
Each pattern maps to a different remediation card type.

### 9.3 Interleaving Engine
Don't show all cards from one concept in sequence. Interleave across concepts — proven by research to dramatically improve retention vs. blocked practice. The scheduler should interleave micro-decks automatically.

### 9.4 The "Dead Time" Widget
A home screen widget (iOS/Android via React Native later):
- Shows one due card
- User can answer and rate without opening the app
- 30 seconds of dead time → one card reviewed
- Built for the commute, the queue, the elevator

### 9.5 Confidence Calibration Mode
A periodic 5-minute meta-session:
- Show a card
- Before revealing the answer: "How confident are you? (1–5)"
- Then reveal the answer and ask if they were right
- Track calibration — students who *think* they know but don't are the most at-risk
- Surface "Overconfident" cards: ones where user rates confidence high but keeps getting wrong

### 9.6 Lecture Audio Ingestion
Beyond PDFs: Record a lecture, upload the audio (or YouTube URL).
- Transcribe via Whisper
- Same concept extraction pipeline on the transcript
- Tags cards with timestamps: "From 34:12 — Professor said..."

### 9.7 "Teach It Back" Mode
At the end of a session, the roles reverse:
- App asks you to explain a concept to an imaginary student
- You type (or speak) a free-form explanation
- AI grades it and points out what you missed
- Based on Feynman Technique: if you can't explain it simply, you don't know it

### 9.8 The Exam Countdown Mode
User sets an exam date. The app:
- Counts down days
- Shows a "readiness score" (% of deck at mastery × days remaining)
- Auto-adjusts daily session size to ensure full mastery by exam day
- Sends a "You're on track" or "You need to add 10 more minutes/day" weekly check-in

### 9.9 Semantic Duplicate Detection
When two cards in a deck cover essentially the same concept, merge or flag them:
- "These two cards seem to be testing the same thing — keep both or merge?"
- Reduces card bloat in large auto-generated decks

### 9.10 A/B Testing Your Card Quality
For shared/community decks, track which card variants perform better:
- "Scenario-based version of this card" vs "MCQ version"
- Users who review faster and rate higher are getting the better variant
- Over time, surface the best card type per concept

---

## 10. The Product Arc — What to Build First

### Phase 1 — MVP (8–10 weeks)
- PDF upload → card generation (Q&A pairs only)
- Basic SM-2 scheduling
- Clean study session UI
- Deck library with mastery %
- Auth + user accounts

### Phase 2 — The Smart Layer (4–6 weeks)
- FSRS algorithm
- Card type evolution (MCQ → cloze → free recall)
- Citation footnotes
- Concept graph / heat map
- ELI5 panic button

### Phase 3 — The Delight Layer (4–6 weeks)
- Cinematic focus mode
- Streak system with shields
- Boss cards
- Audio mode
- Weekly digest

### Phase 4 — Scale & Social (ongoing)
- Community deck sharing
- Lecture audio ingestion
- Mobile widget
- Exam countdown mode
- Collaborative decks

---

*The student who uploads a chapter at 11pm and closes their laptop at 11:45 with 15 cards mastered — that's the moment you're building toward.*
