import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { User, BookOpen, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch some basic aggregate stats
  const decksCount = await prisma.deck.count({
    where: { userId }
  });

  const cardsCount = await prisma.card.count({
    where: { deck: { userId } }
  });

  const reviewsCount = await prisma.reviewLog.count({
    where: { userId }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and view your learning stats.</p>
      </div>

      <div className="bg-card border border-border rounded-[2rem] p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{session.user.name || "Learner"}</h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">{session.user.email}</p>
          </div>
          
          <div className="inline-flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-xl">
             <Trophy size={16} className="text-amber-500" />
             <span>Member since {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
            <BookOpen size={24} />
          </div>
          <p className="text-3xl font-bold text-foreground">{decksCount}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Decks Created</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <User size={24} />
          </div>
          <p className="text-3xl font-bold text-foreground">{cardsCount}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Total Cards</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
            <Flame size={24} />
          </div>
          <p className="text-3xl font-bold text-foreground">{reviewsCount}</p>
          <p className="text-sm font-medium text-muted-foreground mt-1">Reviews Completed</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
         <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
         <p className="text-muted-foreground text-sm mb-6">
           More account management features (password change, data export, etc.) will be added here in the future.
         </p>
         
         <div className="flex justify-end">
            <Link href="/api/auth/signout" className="text-sm font-semibold text-destructive hover:bg-destructive/10 px-4 py-2 rounded-lg transition-colors">
              Sign Out
            </Link>
         </div>
      </div>
    </div>
  );
}
