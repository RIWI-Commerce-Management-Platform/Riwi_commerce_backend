import { QuoteItem } from './quote-item.entity.js';
import { QuoteStatus } from './quote-status.enum.js';

export interface QuoteProps {
  id?: number;
  quoteNumber: string;
  clientId: number;
  status: QuoteStatus;
  subtotal: number;
  total: number;
  notes?: string | null;
  documentKey?: string | null;
  items: QuoteItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class Quote {
  readonly id?: number;
  readonly quoteNumber: string;
  readonly clientId: number;
  status: QuoteStatus;
  subtotal: number;
  total: number;
  notes?: string | null;
  documentKey?: string | null;
  items: QuoteItem[];
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: QuoteProps) {
    this.id = props.id;
    this.quoteNumber = props.quoteNumber;
    this.clientId = props.clientId;
    this.status = props.status;
    this.subtotal = props.subtotal;
    this.total = props.total;
    this.notes = props.notes;
    this.documentKey = props.documentKey;
    this.items = props.items;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  attachDocument(key: string): void {
    this.documentKey = key;
    this.updatedAt = new Date();
  }
}
