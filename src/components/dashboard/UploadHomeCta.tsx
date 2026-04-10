"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileUp } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function UploadHomeCta() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: 0.05 }}
    >
      <Link
        href="/upload"
        className="group relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-border bg-card/90 dark:bg-card p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-md shadow-indigo-500/20">
            <FileUp className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Import</p>
            <p className="mt-0.5 font-semibold text-foreground text-lg leading-snug">
              Upload a PDF to create a new deck
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Same flow as before — now on its own page for a calmer dashboard.
            </p>
          </div>
        </div>
        <span className="relative inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition group-hover:gap-3 sm:self-center">
          Open uploader
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}
