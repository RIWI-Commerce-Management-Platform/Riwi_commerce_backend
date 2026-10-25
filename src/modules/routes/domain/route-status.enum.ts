/**
 * Lifecycle of a commercial route:
 * - DRAFT: being built (steps 1 and 2 of the creation wizard).
 * - ASSIGNED: assigned to an advisor, with visits scheduled in their agenda (step 3).
 * - INACTIVE: soft-deactivated; it stops running but keeps its history.
 */
export enum RouteStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  INACTIVE = 'INACTIVE',
}
