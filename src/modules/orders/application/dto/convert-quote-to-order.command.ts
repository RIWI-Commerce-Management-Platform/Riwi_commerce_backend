import { CurrentActor } from '../../../../shared/auth/domain/current-actor.provider.js';

export interface ConvertQuoteToOrderCommand {
  quoteId: number;
  actorId: number;
  /** With an actor, a quote outside their scope is not found (HU-06). */
  actor?: CurrentActor;
}
