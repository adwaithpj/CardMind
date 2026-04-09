type DeckSortable = {
  lastOpenedAt: Date | null;
  updatedAt: Date;
};

/** Most recently opened first; falls back to updatedAt when never opened. */
export function sortDecksByLastOpened(a: DeckSortable, b: DeckSortable): number {
  const ao = a.lastOpenedAt?.getTime() ?? 0;
  const bo = b.lastOpenedAt?.getTime() ?? 0;
  if (bo !== ao) return bo - ao;
  const au = a.updatedAt?.getTime?.() ?? 0;
  const bu = b.updatedAt?.getTime?.() ?? 0;
  return bu - au;
}
