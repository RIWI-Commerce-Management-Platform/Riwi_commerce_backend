import { QuoteItem } from './quote-item.entity.js';
import { QuoteStatus } from './quote-status.enum.js';
import { InvalidQuoteStatusTransitionError } from './errors/invalid-quote-status-transition.error.js';

export interface QuoteProps {
  id?: number;
  quoteNumber: string;
  clientId: number;
  advisorId?: number | null;
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
  readonly advisorId: number | null;
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
    this.advisorId = props.advisorId ?? null;
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

  changeStatus(newStatus: QuoteStatus): void {
    if (this.status === newStatus) {
      return;
    }

    const allowedTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.REJECTED],
      [QuoteStatus.SENT]: [QuoteStatus.APPROVED, QuoteStatus.REJECTED],
      [QuoteStatus.APPROVED]: [],
      [QuoteStatus.REJECTED]: [],
    };

    const validNextStatuses = allowedTransitions[this.status] ?? [];
    if (!validNextStatuses.includes(newStatus)) {
      throw new InvalidQuoteStatusTransitionError(this.status, newStatus);
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }
}
