"use client";

import { motion } from "framer-motion";
import { FileStack, Sparkles } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function UploadPageHero({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-400/5"
        aria-hidden
      />

      <motion.header
        className="relative mb-10 max-w-2xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-sm backdrop-blur-sm">
          <FileStack className="h-3.5 w-3.5 text-primary" aria-hidden />
          New deck
          <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Turn a PDF into a deck
        </h1>
        <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
          Drop a file below. We extract the text, generate concise cards with Gemini, and open your
          workspace when it&apos;s ready.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.08 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
