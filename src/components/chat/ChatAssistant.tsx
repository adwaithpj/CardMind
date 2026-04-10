"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface DeckOption {
  id: string;
  title: string;
  emoji: string | null;
}

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>();
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [decksLoaded, setDecksLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    if (open && !decksLoaded) {
      fetch("/api/decks")
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setDecks(
              json.data.map((d: { id: string; title: string; emoji: string | null }) => ({
                id: d.id,
                title: d.title,
                emoji: d.emoji,
              }))
            );
          }
          setDecksLoaded(true);
        })
        .catch(() => setDecksLoaded(true));
    }
  }, [open, decksLoaded]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleClose = () => {
    setOpen(false);
    setMessages([]);
    setSelectedDeckId(undefined);
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          deckId: selectedDeckId,
        }),
      });
      const json = await res.json();
      if (json.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: json.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: json.error || "Something went wrong." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "pointer-events-auto fixed z-[36] flex h-14 w-14 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
              "shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20",
              "ring-2 ring-white/20 dark:ring-white/10",
              "transition-transform hover:scale-105 active:scale-[0.98]",
              "bottom-[5.5rem] right-4 sm:bottom-24 sm:right-6 lg:bottom-24 lg:right-8"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            aria-label="Open chat assistant"
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={cn(
              "pointer-events-auto fixed z-[36] flex flex-col",
              "rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 dark:shadow-black/30",
              "bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8",
              "w-[calc(100vw-2rem)] max-w-[380px] h-[min(480px,calc(100dvh-4rem))]"
            )}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    CardMind Assistant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Deck selector */}
            <div className="border-b border-border px-4 py-2 shrink-0">
              <div className="relative">
                <select
                  value={selectedDeckId || ""}
                  onChange={(e) =>
                    setSelectedDeckId(e.target.value || undefined)
                  }
                  className={cn(
                    "w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8",
                    "text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                    "transition"
                  )}
                >
                  <option value="">No deck context</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.emoji || "📚"} {d.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 scrollbar-hide"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    How can I help you study?
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[240px]">
                    Select a deck above for context, then ask me anything about
                    your cards.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-words",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your cards..."
                  className={cn(
                    "flex-1 min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5",
                    "text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  )}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || loading}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                    "bg-primary text-primary-foreground hover:opacity-90",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
