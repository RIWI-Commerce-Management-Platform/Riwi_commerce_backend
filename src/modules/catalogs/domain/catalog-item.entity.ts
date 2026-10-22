export interface BaseCatalogProps {
  id?: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BaseCatalogItem {
  readonly id?: number;
  name: string;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: BaseCatalogProps) {
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

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }
}

export class ClientType extends BaseCatalogItem {}

export interface PotentialProps extends BaseCatalogProps {
  order: number;
}

export class Potential {
  readonly id?: number;
  name: string;
  order: number;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: PotentialProps) {
    this.id = props.id;
    this.name = props.name;
    this.order = props.order;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  update(name?: string, order?: number): void {
    if (name !== undefined) this.name = name;
    if (order !== undefined) this.order = order;
    this.updatedAt = new Date();
  }
}

export class ClientStatus extends BaseCatalogItem {}

export interface PortfolioProps extends BaseCatalogProps {
  description: string;
}

export class Portfolio {
  readonly id?: number;
  name: string;
  description: string;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: PortfolioProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  update(name?: string, description?: string): void {
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    this.updatedAt = new Date();
  }
}

export class VisitResult extends BaseCatalogItem {}
