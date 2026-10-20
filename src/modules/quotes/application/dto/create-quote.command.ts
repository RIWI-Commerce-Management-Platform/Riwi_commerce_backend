import { CreateQuoteItemCommand } from './create-quote-item.command.js';

export interface CreateQuoteCommand {
  clientId: string;
  notes?: string;
  documentKey?: string;
  items: CreateQuoteItemCommand[];
}
