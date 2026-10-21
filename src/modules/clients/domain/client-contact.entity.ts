export interface ClientContactProps {
  id?: number;
  clientId: number;
  name: string;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClientContactProps {
  name?: string;
  position?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  isPrimary?: boolean;
}

export class ClientContact {
  readonly id?: number;
  readonly clientId: number;
  name: string;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  isPrimary: boolean;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ClientContactProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.name = props.name;
    this.position = props.position;
    this.phone = props.phone;
    this.mobile = props.mobile;
    this.email = props.email;
    this.isPrimary = props.isPrimary;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  markAsPrimary(): void {
    this.isPrimary = true;
    this.updatedAt = new Date();
  }

  demoteFromPrimary(): void {
    this.isPrimary = false;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.isPrimary = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  update(props: UpdateClientContactProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.position !== undefined) this.position = props.position;
    if (props.phone !== undefined) this.phone = props.phone;
    if (props.mobile !== undefined) this.mobile = props.mobile;
    if (props.email !== undefined) this.email = props.email;
    if (props.isPrimary !== undefined) this.isPrimary = props.isPrimary;
    this.updatedAt = new Date();
  }
}
