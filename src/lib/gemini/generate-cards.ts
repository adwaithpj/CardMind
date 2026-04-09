import { ai, MODEL } from "./client";
import CardProductionRule from "@/rules/cardProduction.rule";

export interface GeneratedCard {
  front: string;
  back: string;
  tags: string[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function is429(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return msg.includes('"code":429') || msg.includes("RESOURCE_EXHAUSTED");
}

/** Parse the retryDelay the API embeds in the 429 body (e.g. "54.45s" → 55500 ms). */
function getRetryDelayMs(err: unknown, fallbackMs = 60_000): number {
  try {
    const msg = String(err instanceof Error ? err.message : err);
    const match = msg.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000 + 500;
  } catch {
    /* ignore */
  }
  return fallbackMs;
}

function parseCardsJson(raw: string): GeneratedCard[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in response");
  const parsed: GeneratedCard[] = JSON.parse(match[0]);
  return parsed
    .filter(
      (c) =>
        typeof c.front === "string" &&
        typeof c.back === "string" &&
        c.front.trim().length > 0 &&
        c.back.trim().length > 0,
    )
    .map((c) => ({
      front: c.front.trim(),
      back: c.back.trim(),
      tags: Array.isArray(c.tags)
        ? c.tags.filter((t) => typeof t === "string")
        : [],
    }));
}

/**
 * Send the PDF buffer directly to Gemini as inline data.
 * Gemini reads the full document natively — no need to pre-extract text.
 */
export async function generateCardsFromPdf(
  pdfBuffer: Buffer,
  subject: string,
  retries = 2,
): Promise<GeneratedCard[]> {
  const pdfBase64 = pdfBuffer.toString("base64");

  const prompt = `${CardProductionRule}

Subject: ${subject}

Read the full PDF document above and generate between 15 and 50 high-quality flashcards covering all key topics.

Return ONLY a valid JSON array — no markdown, no explanation, just the array.
Schema: [{"front": "question", "back": "answer", "tags": ["tag1", "tag2"]}]`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const text = response.text ?? "";
      const cards = parseCardsJson(text);

      if (cards.length < 3 && attempt < retries) {
        await sleep(1500 * (attempt + 1));
        continue;
      }

      // Deduplicate by front text
      const seen = new Set<string>();
      return cards
        .filter((c) => {
          const key = c.front.toLowerCase().slice(0, 60);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 60);
    } catch (err) {
      console.error(`Card generation attempt ${attempt + 1} failed:`, err);
      if (attempt === retries) return [];
      const delay = is429(err) ? getRetryDelayMs(err) : 1500 * (attempt + 1);
      if (is429(err))
        console.warn(`Rate limited — waiting ${delay / 1000}s before retry...`);
      await sleep(delay);
    }
  }
  return [];
}

/**
 * Ask Gemini to infer a short title and relevant emoji from the PDF itself.
 * Falls back to the filename on any failure after retries.
 */
export async function inferDeckTitle(
  pdfBuffer: Buffer,
  filename: string,
  retries = 2,
): Promise<{ title: string; emoji: string }> {
  const fallback = {
    title: filename.replace(/\.pdf$/i, "").slice(0, 80),
    emoji: "📚",
  };

  const pdfBase64 = pdfBuffer.toString("base64");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
              {
                text: `Based on this document, generate a short deck title (max 6 words) and a single relevant emoji.
Return JSON only: {"title": "...", "emoji": "..."}`,
              },
            ],
          },
        ],
      });

      const raw = response.text ?? "";
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.title) {
          return {
            title: String(parsed.title).slice(0, 80),
            emoji: parsed.emoji || "📚",
          };
        }
      }
      // Unparseable response — fall through to fallback
      break;
    } catch (err) {
      if (attempt === retries) {
        console.warn(
          "Title inference failed after retries — using filename as fallback:",
          filename,
        );
        return fallback;
      }
      const delay = is429(err) ? getRetryDelayMs(err) : 2000 * (attempt + 1);
      if (is429(err))
        console.warn(
          `Title inference rate limited — waiting ${delay / 1000}s...`,
        );
      await sleep(delay);
    }
  }

  return fallback;
}
