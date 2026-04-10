import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flame, BookOpen, Star, BarChart2, Play } from "lucide-react";
import { MasteryRing } from "@/components/progress/MasteryRing";
import { CardList } from "@/components/deck/CardList";
import { DeckDeleteButton } from "@/components/deck/DeckDeleteButton";
import { formatRelativeDate } from "@/lib/utils";
import {
  computeMasteryProgressPercent,
  countMasteredCards,
} from "@/lib/srs/mastery";
import { touchDeckLastOpened } from "@/lib/decks/touch-last-opened";

export const dynamic = "force-dynamic";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id, userId },
  });

  if (!deck) notFound();

  await touchDeckLastOpened(id, userId);

  const deckCards = await prisma.card.findMany({
    where: { deckId: id },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const stats = {
    total: deckCards.length,
    due: deckCards.filter((c) => c.repetitions > 0 && c.dueDate <= now).length,
    newCards: deckCards.filter((c) => c.repetitions === 0).length,
    mastered: countMasteredCards(deckCards),
    learning: deckCards.filter(
      (c) => c.repetitions > 0 && c.repetitions < 3 && c.dueDate > now
    ).length,
  };

  const mastery = computeMasteryProgressPercent(deckCards);
  const canReview = stats.due > 0 || stats.newCards > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Back to decks
      </Link>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{deck.emoji ?? "📚"}</span>
            <div>
              <h1 className="text-xl font-bold text-foreground">{deck.title}</h1>
              {deck.sourceFilename && (
                <p className="text-sm text-muted-foreground mt-0.5">{deck.sourceFilename}</p>
              )}
              {deck.lastStudiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last studied {formatRelativeDate(deck.lastStudiedAt)}
                </p>
              )}
            </div>
          </div>
          <MasteryRing percent={mastery} size={64} strokeWidth={5} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Total", value: stats.total, icon: BookOpen, color: "text-muted-foreground" },
            { label: "Due", value: stats.due, icon: Flame, color: stats.due > 0 ? "text-orange-500" : "text-muted-foreground" },
            { label: "New", value: stats.newCards, icon: BarChart2, color: "text-blue-500" },
            { label: "Mastered", value: stats.mastered, icon: Star, color: "text-emerald-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-muted/50 rounded-xl p-4 text-center">
              <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {stats.total > 0 && (
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            {canReview ? (
              <Link
                href={`/review/${id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md shadow-primary/25 dark:shadow-primary/10"
              >
                <Play size={16} />
                Daily review
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {stats.due + stats.newCards} cards
                </span>
              </Link>
            ) : null}
            <Link
              href={`/review/${id}?mode=cram`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-muted/40 text-foreground font-semibold hover:bg-muted transition text-sm"
            >
              <Play size={16} />
              Cram all ({stats.total})
            </Link>
            <Link
              href={`/review/${id}?zen=1`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground font-medium hover:text-foreground hover:bg-muted/50 transition text-sm"
            >
              Zen review
            </Link>
          </div>
        )}
        {stats.total > 0 && !canReview && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            No due cards — use Cram to practice anyway.
          </p>
        )}
        {stats.total === 0 && (
          <div className="mt-5 flex items-center gap-2 justify-center py-3 bg-muted/50 text-muted-foreground rounded-xl border border-border text-sm font-medium">
            No cards in this deck yet.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Remove this deck and all of its cards from your library.</p>
          <DeckDeleteButton deckId={id} deckTitle={deck.title} className="shrink-0 self-start sm:self-auto" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Cards</h2>
        <CardList cards={deckCards} />
      </div>
    </div>
  );
}
