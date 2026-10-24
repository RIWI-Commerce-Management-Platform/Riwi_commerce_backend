import { CreateQuoteItemCommand } from './create-quote-item.command.js';

export interface CreateQuoteCommand {
  clientId: number;
  advisorId?: number | null;
  notes?: string;
  documentKey?: string;
  items: CreateQuoteItemCommand[];
}
