"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, Loader2, X, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertDeckFromUpload } from "@/lib/local-db/sync-decks";

type UploadState = "idle" | "dragging" | "uploading" | "processing" | "success" | "error";

type UploadZoneProps = {
  className?: string;
};

export function UploadZone({ className }: UploadZoneProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState("");

  const upload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      setState("error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum size is 20MB.");
      setState("error");
      return;
    }

    setState("uploading");
    setProgress("Extracting text from PDF...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setState("processing");
      setProgress("Gemini is reading your PDF and crafting flashcards...");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Upload failed");

      setState("success");
      setProgress(`Created ${json.data.cardCount} flashcards!`);

      const userId = session?.user?.id;
      if (userId && json.data?.deckId && json.data?.title != null) {
        await upsertDeckFromUpload({
          deckId: json.data.deckId,
          title: json.data.title,
          cardCount: json.data.cardCount,
          userId,
        });
      }

      setTimeout(() => {
        router.push(`/decks/${json.data.deckId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }, [router, session?.user?.id]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setState("idle");
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  const isActive = state !== "idle" && state !== "error";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-[2.5rem] transition-all duration-300 cursor-pointer overflow-hidden group",
          state === "dragging"
            ? "border-primary bg-primary/5 scale-[1.01]"
            : state === "success"
            ? "border-emerald-500 bg-emerald-500/5"
            : state === "error"
            ? "border-destructive/30 bg-destructive/5"
            : isActive
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={handleDrop}
        onClick={() => state === "idle" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {state === "idle" || state === "dragging" ? (
            <>
              <div className={cn(
                "w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 transition-all duration-300",
                state === "dragging" ? "gradient-brand scale-110 shadow-2xl shadow-primary/20" : "bg-muted"
              )}>
                <Upload className={cn("w-7 h-7", state === "dragging" ? "text-white" : "text-muted-foreground")} />
              </div>
              <p className="text-foreground font-bold text-xl tracking-tight">
                {state === "dragging" ? "Release to upload" : "Upload PDF to create deck"}
              </p>
              <p className="text-muted-foreground text-base mt-2 max-w-sm mx-auto">
                Drag and drop your PDF here, or{" "}
                <span className="text-primary font-semibold hover:underline">browse files</span>
                <br />
                <span className="text-sm opacity-60">Maximum file size: 20MB</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent">
                  <Sparkles size={12} className="text-primary" />
                  Gemini AI
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent">
                   SM-2 Spaced Repetition
                </span>
              </div>
            </>
          ) : state === "uploading" || state === "processing" ? (
            <>
              <div className="w-16 h-16 rounded-[1.25rem] gradient-brand flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
              <p className="text-foreground font-bold text-xl tracking-tight">{progress}</p>
              <p className="text-muted-foreground text-sm mt-2 animate-pulse">Our AI is reading through your content...</p>
            </>
          ) : state === "success" ? (
            <>
              <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-500 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-foreground font-bold text-xl tracking-tight">{progress}</p>
              <p className="text-emerald-500 font-medium text-sm mt-2">Redirecting to your new workspace...</p>
            </>
          ) : null}
        </div>
      </div>

      {state === "error" && (
        <div className="mt-4 flex items-start gap-3 text-sm text-destructive bg-destructive/5 px-6 py-4 rounded-3xl border border-destructive/10 animate-in fade-in slide-in-from-top-2">
          <X size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold uppercase tracking-widest text-[10px] opacity-70 mb-1">Error</p>
            <p className="font-medium text-base">{error}</p>
          </div>
          <button
            onClick={() => { setState("idle"); setError(""); }}
            className="shrink-0 text-destructive/60 hover:text-destructive font-bold text-xs uppercase tracking-widest py-1 px-3 border border-destructive/20 rounded-full hover:bg-destructive/10 transition-all"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
