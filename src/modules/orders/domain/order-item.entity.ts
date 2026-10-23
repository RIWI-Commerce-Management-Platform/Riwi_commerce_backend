export interface OrderItemProps {
  id?: number;
  orderId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderItem {
  readonly id?: number;
  readonly orderId?: number;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;

  constructor(props: OrderItemProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.subtotal = props.subtotal;
  }
}
