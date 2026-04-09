import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStudyActivitySummary } from "@/lib/stats/study-activity";
import { sortDecksByLastOpened } from "@/lib/decks/sort-by-last-opened";
import { enrichDecksWithMasteryProgress } from "@/lib/srs/mastery";
import { DeckGrid } from "@/components/deck/DeckGrid";
import { UploadHomeCta } from "@/components/dashboard/UploadHomeCta";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { ReviewActivityCard } from "@/components/dashboard/ReviewActivityCard";
import {
  StudyMomentumCard,
  FirstReviewBanner,
} from "@/components/dashboard/StudyMomentumCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const userDecksRaw = await prisma.deck.findMany({
    where: { userId },
  });
  const sorted = [...userDecksRaw].sort(sortDecksByLastOpened);
  const userDecks = await enrichDecksWithMasteryProgress(sorted);

  const totalDue = userDecks.reduce((s, d) => s + (d.dueCards ?? 0), 0);
  const totalCards = userDecks.reduce((s, d) => s + (d.totalCards ?? 0), 0);
  const totalMastered = userDecks.reduce((s, d) => s + (d.masteredCards ?? 0), 0);

  const activity = await getStudyActivitySummary(userId);
  const firstReviewDeck = userDecks.find(
    (d) => !d.lastStudiedAt && (d.totalCards ?? 0) > 0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Good {getGreeting()}, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {totalDue > 0
            ? `You have ${totalDue} card${totalDue !== 1 ? "s" : ""} due for review today.`
            : userDecks.length > 0
            ? "You're all caught up! Keep it up."
            : "Upload your first PDF to get started."}
        </p>
      </div>

      {firstReviewDeck && (
        <FirstReviewBanner
          deckId={firstReviewDeck.id}
          deckTitle={firstReviewDeck.title}
          emoji={firstReviewDeck.emoji ?? "📚"}
          cardCount={firstReviewDeck.totalCards ?? 0}
        />
      )}

      {userDecks.length > 0 && (
        <StatsBar
          totalDecks={userDecks.length}
          totalCards={totalCards}
          totalDue={totalDue}
          totalMastered={totalMastered}
        />
      )}

      {userDecks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Momentum &amp; activity</h2>
          <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0">
              <StudyMomentumCard data={activity} />
            </div>
            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              <p className="text-sm font-medium text-muted-foreground shrink-0">
                In progress &amp; last opened
              </p>
              <div className="min-h-0 min-w-0 w-full">
                <ReviewActivityCard />
              </div>
            </div>
          </div>
        </section>
      )}

      <UploadHomeCta />

      <div className="pt-4">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          {userDecks.length > 0 ? "Your Decks" : ""}
        </h2>
        <DeckGrid decks={userDecks} />
      </div>
    </div>
  );
}
