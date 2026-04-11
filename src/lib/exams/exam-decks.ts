type ExamWithLinks = {
  deckId: string | null;
  examDecks?: { deckId: string }[];
};

/** Resolves linked deck ids: junction rows first, else legacy single `deckId`. */
export function getExamLinkedDeckIds(exam: ExamWithLinks): string[] {
  const fromJunction = exam.examDecks?.map((r) => r.deckId) ?? [];
  if (fromJunction.length > 0) {
    return [...new Set(fromJunction)];
  }
  if (exam.deckId) {
    return [exam.deckId];
  }
  return [];
}
