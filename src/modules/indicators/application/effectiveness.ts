/** Completed visits over scheduled visits, as a percentage with one decimal. */
export function effectiveness(completed: number, scheduled: number): number {
  if (scheduled <= 0) {
    return 0;
  }
  return Math.round((completed / scheduled) * 1000) / 10;
}
