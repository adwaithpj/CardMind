import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCardsFromPdf, inferDeckTitle } from "@/lib/gemini/generate-cards";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Both calls send the PDF buffer directly to Gemini — no text extraction needed
    const [{ title, emoji }, generatedCards] = await Promise.all([
      inferDeckTitle(buffer, file.name),
      generateCardsFromPdf(buffer, file.name),
    ]);

    if (generatedCards.length === 0) {
      return NextResponse.json(
        { error: "Could not generate cards from this PDF. Make sure it contains readable text." },
        { status: 422 }
      );
    }

    const deck = await prisma.deck.create({
      data: {
        userId: session.user.id,
        title,
        emoji,
        description: `${generatedCards.length} cards`,
        sourceFilename: file.name,
        totalCards: generatedCards.length,
        newCards: generatedCards.length,
      },
    });

    await prisma.card.createMany({
      data: generatedCards.map((c) => ({
        deckId: deck.id,
        front: c.front,
        back: c.back,
        tags: c.tags,
      })),
    });

    return NextResponse.json({
      data: { deckId: deck.id, title, cardCount: generatedCards.length },
    });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
