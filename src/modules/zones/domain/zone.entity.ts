export interface ZoneProps {
  id?: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Zone {
  readonly id?: number;
  name: string;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ZoneProps) {
    this.id = props.id;
    this.name = props.name;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
