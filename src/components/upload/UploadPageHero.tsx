"use client";

import { motion } from "framer-motion";
import { FileStack, Sparkles } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function UploadPageHero({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <motion.header
        className="mb-10 max-w-2xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm backdrop-blur-sm">
          <FileStack className="h-3.5 w-3.5" aria-hidden />
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
