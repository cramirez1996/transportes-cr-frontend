export enum TripStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
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
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  capacity: string;
  status: string;
  mileage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: string;
  status: string;
  hireDate: string;
  createdAt: Date;
  updatedAt: Date;
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
  supplierType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  customer: Customer;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  origin: string;
  destination: string;

  // Kilometraje
  startKm?: number; // Kilometraje de salida (ingresado manualmente)
  endKm?: number | null; // Kilometraje de llegada (ingresado manualmente)
  totalKm?: number | null; // Calculado automáticamente: endKm - startKm

  // Fechas y horarios
  departureDate: Date; // Fecha de salida (ingresada manualmente)
  arrivalDate?: Date | null; // Fecha de llegada (automática por georeferencia o manual)
  isArrivalManual: boolean; // Indica si la fecha de llegada fue ingresada manualmente

  // Costos
  agreedPrice: string; // Precio acordado con el cliente (viene como string desde la API)
  totalExpenses?: number; // Total de gastos (calculado desde Transactions)
  profit?: number; // Ganancia: agreedPrice - totalExpenses

  // Subcontracting
  isSubcontracted: boolean; // ¿Viaje subcontratado?
  subcontractor?: Supplier | null; // Proveedor/subcontratista
  subcontractorCost?: number | null; // Costo del subcontratista
  commissionAmount?: number | null; // Comisión (calculado: agreedPrice - subcontractorCost)

  status: TripStatus;
  notes?: string;
  tags?: Record<string, any>; // Tags personalizados en formato clave-valor
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTripDto {
  customerId: string;
  isSubcontracted?: boolean;
  // Required when NOT subcontracted
  vehicleId?: string;
  driverId?: string;
  // Required when subcontracted
  subcontractorId?: string;
  subcontractorCost?: number;
  // Common fields
  origin: string;
  destination: string;
  departureDate: Date;
  arrivalDate?: Date;
  isArrivalManual?: boolean;
  agreedPrice: number;
  startKm?: number;
  notes?: string;
  tags?: Record<string, any>;
}

export interface UpdateTripDto {
  customerId?: string;
  isSubcontracted?: boolean;
  vehicleId?: string;
  driverId?: string;
  subcontractorId?: string;
  subcontractorCost?: number;
  origin?: string;
  destination?: string;
  departureDate?: Date;
  arrivalDate?: Date;
  isArrivalManual?: boolean;
  startKm?: number;
  endKm?: number;
  agreedPrice?: number;
  status?: TripStatus;
  notes?: string;
  tags?: Record<string, any>;
}
