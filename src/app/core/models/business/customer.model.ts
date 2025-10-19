export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Customer {
  id: string;
  rut: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  status: CustomerStatus;
  tags: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  totalTrips?: number;
  totalRevenue?: number;
}

export interface CreateCustomerDto {
  rut: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  status?: CustomerStatus;
  tags?: Record<string, any>;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
