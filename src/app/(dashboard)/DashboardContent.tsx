"use client";

import { motion } from "framer-motion";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { UploadFab } from "@/components/layout/UploadFab";
import { DashboardServerRefresh } from "@/components/dashboard/DashboardServerRefresh";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 min-h-screen transition-all duration-300 pt-14 sm:pt-16 lg:pt-0 relative pointer-events-none",
        isExpanded ? "lg:ml-64" : "lg:ml-20"
      )}
    >
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 relative z-[1] pointer-events-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease }}
      >
        {children}
      </motion.div>
      <UploadFab />
      <DashboardServerRefresh />
    </main>
  );
}
