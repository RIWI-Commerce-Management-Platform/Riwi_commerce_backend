export interface ClientFilterCriteria {
  search?: string;
  zoneId?: string;
  clientTypeId?: string;
  potentialId?: string;
  municipality?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

