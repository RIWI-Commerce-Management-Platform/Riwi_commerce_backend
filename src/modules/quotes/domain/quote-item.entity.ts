export interface QuoteItemProps {
  id: string;
  quoteId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class QuoteItem {
  readonly id: string;
  quoteId?: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;

  constructor(props: QuoteItemProps) {
    this.id = props.id;
    this.quoteId = props.quoteId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.subtotal = props.subtotal;
  }
}
