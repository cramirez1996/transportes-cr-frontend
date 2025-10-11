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
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
