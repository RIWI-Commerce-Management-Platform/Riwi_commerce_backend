import { CreateQuoteItemCommand } from './create-quote-item.command.js';

export interface CreateQuoteCommand {
  clientId: number;
  notes?: string;
  documentKey?: string;
  items: CreateQuoteItemCommand[];
}
