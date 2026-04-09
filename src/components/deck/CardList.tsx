"use client";

import { useState } from "react";
import { Card } from "@/lib/db/schema";
import { getCardStatus } from "@/lib/srs/sm2";
import { formatDueDate } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-50 text-blue-600 border-blue-100" },
  learning: { label: "Learning", color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
  review: { label: "Due", color: "bg-orange-50 text-orange-600 border-orange-100" },
  mastered: { label: "Mastered", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

export function CardList({ cards }: { cards: Card[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {cards.map((card) => {
        const status = getCardStatus(card as Parameters<typeof getCardStatus>[0]);
        const cfg = STATUS_CONFIG[status];
        const isExpanded = expandedId === card.id;

        return (
          <div
            key={card.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : card.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left"
            >
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-lg border flex-shrink-0",
                  cfg.color
                )}
              >
                {cfg.label}
              </span>
              <p className="text-sm text-slate-700 font-medium flex-1 truncate">
                {card.front}
              </p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-400 hidden sm:block">
                  {formatDueDate(card.dueDate)}
                </span>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-4 pt-0 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {card.back}
                </p>
                {card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
