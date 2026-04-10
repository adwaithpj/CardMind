import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ai, MODEL } from "@/lib/gemini/client";
import { z } from "zod";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
  deckId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (body.deckId) {
      const deck = await prisma.deck.findFirst({
        where: { id: body.deckId, userId: session.user.id },
        include: {
          cards: { select: { front: true, back: true }, take: 120 },
        },
      });

      if (deck && deck.cards.length > 0) {
        const cardContext = deck.cards
          .map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`)
          .join("\n");

        contents.push({
          role: "user",
          parts: [
            {
              text: [
                `You are CardMind, a friendly flashcard study assistant.`,
                `The user is studying the deck "${deck.title}" (${deck.cards.length} cards).`,
                `Here are the cards for context:\n${cardContext}`,
                `\nUse this context to help the user study, explain concepts, quiz them, or answer questions about the material.`,
                `Keep answers concise and helpful. If the user asks something unrelated to the deck, still help but gently guide them back to studying.`,
              ].join("\n"),
            },
          ],
        });

        contents.push({
          role: "model",
          parts: [
            {
              text: `Got it! I have the "${deck.title}" deck loaded. How can I help you study?`,
            },
          ],
        });
      }
    }

    for (const msg of body.messages) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.content }],
      });
    }

    const result = await ai.models.generateContent({
      model: MODEL,
      contents,
    });

    const reply =
      result.text?.trim() || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ data: { reply } });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
