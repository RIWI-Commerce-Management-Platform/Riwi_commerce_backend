export interface ClientFilterCriteria {
  search?: string;
  zoneId?: number;
  clientTypeId?: number;
  potentialId?: number;
  municipality?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}
