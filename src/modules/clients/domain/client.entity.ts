export interface ClientProps {
  id?: number;
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  department: string;
  municipality: string;
  neighborhood: string;
  phone: string;
  email: string;
  zoneId: number;
  clientTypeId: number;
  potentialId: number;
  clientStatusId: number;
  visitFrequencyDays: number;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClientProps {
  nit?: string;
  businessName?: string;
  commercialName?: string;
  address?: string;
  department?: string;
  municipality?: string;
  neighborhood?: string;
  phone?: string;
  email?: string;
  zoneId?: number;
  clientTypeId?: number;
  potentialId?: number;
  clientStatusId?: number;
  visitFrequencyDays?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export class Client {
  readonly id?: number;
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  department: string;
  municipality: string;
  neighborhood: string;
  phone: string;
  email: string;
  zoneId: number;
  clientTypeId: number;
  potentialId: number;
  clientStatusId: number;
  visitFrequencyDays: number;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ClientProps) {
    this.id = props.id;
    this.nit = props.nit;
    this.businessName = props.businessName;
    this.commercialName = props.commercialName;
    this.address = props.address;
    this.department = props.department;
    this.municipality = props.municipality;
    this.neighborhood = props.neighborhood;
    this.phone = props.phone;
    this.email = props.email;
    this.zoneId = props.zoneId;
    this.clientTypeId = props.clientTypeId;
    this.potentialId = props.potentialId;
    this.clientStatusId = props.clientStatusId;
    this.visitFrequencyDays = props.visitFrequencyDays;
    this.latitude = props.latitude ?? null;
    this.longitude = props.longitude ?? null;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  update(props: UpdateClientProps): void {
    if (props.nit !== undefined) this.nit = props.nit;
    if (props.businessName !== undefined) this.businessName = props.businessName;
    if (props.commercialName !== undefined) this.commercialName = props.commercialName;
    if (props.address !== undefined) this.address = props.address;
    if (props.department !== undefined) this.department = props.department;
    if (props.municipality !== undefined) this.municipality = props.municipality;
    if (props.neighborhood !== undefined) this.neighborhood = props.neighborhood;
    if (props.phone !== undefined) this.phone = props.phone;
    if (props.email !== undefined) this.email = props.email;
    if (props.zoneId !== undefined) this.zoneId = props.zoneId;
    if (props.clientTypeId !== undefined) this.clientTypeId = props.clientTypeId;
    if (props.potentialId !== undefined) this.potentialId = props.potentialId;
    if (props.clientStatusId !== undefined) this.clientStatusId = props.clientStatusId;
    if (props.visitFrequencyDays !== undefined) this.visitFrequencyDays = props.visitFrequencyDays;
    if (props.latitude !== undefined) this.latitude = props.latitude;
    if (props.longitude !== undefined) this.longitude = props.longitude;
    this.updatedAt = new Date();
  }
}
