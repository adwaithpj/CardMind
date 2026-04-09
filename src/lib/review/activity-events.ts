/** Fired when review session state changes (PATCH / batch submit) so dashboard can refetch. */
export const REVIEW_ACTIVITY_CHANGED = "cardmind:review-activity-changed";

export function notifyReviewActivityChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REVIEW_ACTIVITY_CHANGED));
}
