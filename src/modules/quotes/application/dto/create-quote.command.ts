import { CreateQuoteItemCommand } from './create-quote-item.command.js';

export interface CreateQuoteCommand {
  clientId: number;
  /** Authenticated user creating the quote (HU-06). */
  advisorId?: number;
  /** Visit that generated the quote (HU-27). */
  visitId?: number;
  notes?: string;
  documentKey?: string;
  items: CreateQuoteItemCommand[];
}
