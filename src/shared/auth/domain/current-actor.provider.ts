import { UserRole } from '../../../modules/auth/domain/user-role.enum.js';

/** The authenticated user with the role and zone read from the database. */
export interface CurrentActor {
  id: number;
  role: UserRole;
  zoneId: number | null;
}

/** Visibility filter derived from the actor's role (HU-06). */
export interface ActorScope {
  advisorId?: number;
  zoneId?: number;
}

/**
 * Abstract port that resolves the authenticated user together with the role
 * and zone stored in the database, so use cases can restrict what each role
 * sees without reading the session or the user table themselves.
 */
export abstract class CurrentActorProvider {
  abstract extract(request: object): Promise<CurrentActor>;
}

/**
 * An advisor only sees their own records and a regional director only sees
 * their zone. An admin, or a call without an actor, has no restriction.
 * A director without a zone gets an impossible zone id so nothing leaks.
 */
export function scopeForActor(actor?: CurrentActor | null): ActorScope {
  if (!actor) {
    return {};
  }
  if (actor.role === UserRole.ASESOR) {
    return { advisorId: actor.id };
  }
  if (actor.role === UserRole.DIRECTOR_REGIONAL) {
    return { zoneId: actor.zoneId ?? -1 };
  }
  return {};
}
