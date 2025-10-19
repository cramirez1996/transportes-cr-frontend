export enum SupplierType {
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  PARTS = 'PARTS',
  INSURANCE = 'INSURANCE',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Supplier {
  id: string;
  rut: string;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  supplierType: SupplierType;
  status: SupplierStatus;
  tags?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplierDto {
  rut: string;
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  supplierType: SupplierType;
  status?: SupplierStatus;
  tags?: Record<string, any>;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}
