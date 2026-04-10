import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { DashboardBackdrop } from "@/components/layout/DashboardBackdrop";
import { DeckLocalSync } from "@/components/sync/DeckLocalSync";
import { DashboardContent } from "@/app/(dashboard)/DashboardContent";
import { ChatAssistant } from "@/components/chat/ChatAssistant";

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <DeckLocalSync />
      <DashboardBackdrop>
        <div className="flex min-h-screen w-full bg-transparent pointer-events-none">
          <Sidebar user={session.user} />
          <DashboardContent>{children}</DashboardContent>
        </div>
        <ChatAssistant />
      </DashboardBackdrop>
    </SidebarProvider>
  );
}
