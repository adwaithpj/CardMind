import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { touchDeckLastOpened } from "@/lib/decks/touch-last-opened";
import { notFound } from "next/navigation";
import { ReviewSession } from "@/components/review/ReviewSession";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id: deckId, userId },
  });

  if (!deck) notFound();

  await touchDeckLastOpened(deckId, userId);

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground text-sm">
          Loading session…
        </div>
      }
    >
      <ReviewSession deck={deck} />
    </Suspense>
  );
}
