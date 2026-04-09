import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Flame, CheckCircle, Play } from "lucide-react";
import { MasteryRing } from "@/components/progress/MasteryRing";
import { enrichDecksWithMasteryProgress } from "@/lib/srs/mastery";

export const dynamic = "force-dynamic";

export default async function ReviewHubPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const userDecksRaw = await prisma.deck.findMany({
    where: { userId },
    orderBy: [{ dueCards: "desc" }, { updatedAt: "desc" }],
  });
  const userDecks = await enrichDecksWithMasteryProgress(userDecksRaw);

  const dueDecks = userDecks.filter((d) => (d.dueCards ?? 0) + (d.newCards ?? 0) > 0);
  const doneDecks = userDecks.filter((d) => (d.dueCards ?? 0) + (d.newCards ?? 0) === 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          {dueDecks.length > 0
            ? `${dueDecks.length} deck${dueDecks.length !== 1 ? "s" : ""} waiting for you`
            : "You're all caught up! 🎉"}
        </p>
      </div>

      {dueDecks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Due Now
          </h2>
          <div className="space-y-3">
            {dueDecks.map((deck) => {
              const mastery = deck.masteryProgressPercent;
              return (
                <div
                  key={deck.id}
                  className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{deck.emoji ?? "📚"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{deck.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        {(deck.dueCards ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-orange-500 font-medium">
                            <Flame size={11} /> {deck.dueCards} due
                          </span>
                        )}
                        {(deck.newCards ?? 0) > 0 && (
                          <span className="text-blue-500 font-medium">{deck.newCards} new</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium sm:hidden">Mastery:</span>
                      <MasteryRing percent={mastery} size={44} />
                    </div>
                    <Link
                      href={`/review/${deck.id}`}
                      className="flex items-center gap-2 gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition shadow-sm shadow-primary/20 shrink-0"
                    >
                      <Play size={14} className="fill-current" /> Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {doneDecks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            All Caught Up
          </h2>
          <div className="space-y-2">
            {doneDecks.map((deck) => {
              const mastery = deck.masteryProgressPercent;
              return (
                <Link key={deck.id} href={`/decks/${deck.id}`} className="block">
                  <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 hover:border-border transition-all opacity-75 hover:opacity-100">
                    <span className="text-xl shrink-0">{deck.emoji ?? "📚"}</span>
                    <p className="flex-1 text-sm font-medium text-foreground truncate">
                      {deck.title}
                    </p>
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <div className="shrink-0">
                      <MasteryRing percent={mastery} size={36} strokeWidth={3} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {userDecks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-medium">No decks yet</p>
          <p className="text-sm mt-1">
            <Link href="/upload" className="text-primary hover:underline">
              Upload a PDF
            </Link>{" "}
            to get started
          </p>
        </div>
      )}
    </div>
  );
}
