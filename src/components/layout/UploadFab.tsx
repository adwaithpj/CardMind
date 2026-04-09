"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadFab() {
  const pathname = usePathname();
  if (pathname === "/upload") return null;

  return (
    <motion.div
      className={cn(
        "pointer-events-none fixed z-[35] flex justify-end",
        "bottom-6 right-4 sm:bottom-8 sm:right-6",
        "lg:bottom-8 lg:right-8"
      )}
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.15 }}
    >
      <Link
        href="/upload"
        className={cn(
          "pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-2xl",
          "gradient-brand text-white shadow-lg shadow-indigo-500/30",
          "ring-2 ring-white/20 dark:ring-white/10",
          "transition-transform hover:scale-105 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        aria-label="Upload PDF"
      >
        <Plus
          className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90"
          strokeWidth={2.25}
        />
        <span className="sr-only">Upload PDF</span>
      </Link>
    </motion.div>
  );
}
