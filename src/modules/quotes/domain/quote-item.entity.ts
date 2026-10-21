export interface QuoteItemProps {
  id?: number;
  quoteId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class QuoteItem {
  readonly id?: number;
  quoteId?: number;
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
