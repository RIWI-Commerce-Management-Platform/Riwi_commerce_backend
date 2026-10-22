export interface ClientFilterCriteria {
  clientId?: number;
  search?: string;
  zoneId?: number;
  clientTypeId?: number;
  potentialId?: number;
  municipality?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}
