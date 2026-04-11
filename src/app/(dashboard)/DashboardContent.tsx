"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { UploadFab } from "@/components/layout/UploadFab";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { DashboardClock } from "@/components/layout/DashboardClock";
import { DashboardServerRefresh } from "@/components/dashboard/DashboardServerRefresh";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();
  const pathname = usePathname();

  const isReviewRoute =
    pathname.startsWith("/review/") && pathname.split("/").length >= 3;

  return (
    <main
      className={cn(
        "flex-1 min-h-screen transition-all duration-300 relative pointer-events-none overflow-hidden",
        isReviewRoute
          ? "ml-0 lg:ml-0 pt-0 lg:pt-0"
          : cn("pt-14 sm:pt-16 lg:pt-0", isExpanded ? "lg:ml-64" : "lg:ml-20"),
      )}
    >
      {!isReviewRoute && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent dark:from-primary/[0.04] dark:via-primary/[0.015] dark:to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-primary/[0.09] blur-3xl dark:bg-primary/[0.04] dark:blur-[120px]"
            aria-hidden
          />
        </>
      )}
      <motion.div
        className={cn(
          "relative z-[1] pointer-events-auto",
          isReviewRoute
            ? "max-w-none px-0 py-0"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease }}
      >
        {children}
      </motion.div>
      {!isReviewRoute && (
        <>
          <DashboardClock />
          <ChatAssistant />
        </>
      )}
      <UploadFab />
      <DashboardServerRefresh />
    </main>
  );
}
