export interface Driver {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  licenseExpiry?: Date;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: Date;
  totalTrips?: number;
}

export interface CreateDriverDto {
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  licenseExpiry?: Date;
  hireDate: Date;
}
