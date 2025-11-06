export enum TripGroupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TripGroup {
  id: string;
  tenantId: string;
  code: string;
  description?: string;
  status: TripGroupStatus;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relaciones
  trips?: any[]; // Will use Trip[] when imported
  expenses?: any[]; // Transactions associated with this trip group

  // Campos calculados
  totalRevenue?: number;
  totalExpenses?: number;
  profit?: number;
  tripCount?: number;
}

export interface CreateTripGroupDto {
  code?: string;
  description?: string;
  status?: TripGroupStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateTripGroupDto {
  code?: string;
  description?: string;
  status?: TripGroupStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export const TRIP_GROUP_STATUS_LABELS: Record<TripGroupStatus, string> = {
  [TripGroupStatus.PENDING]: 'Pendiente',
  [TripGroupStatus.IN_PROGRESS]: 'En Progreso',
  [TripGroupStatus.COMPLETED]: 'Completada',
  [TripGroupStatus.CANCELLED]: 'Cancelada',
};

export const TRIP_GROUP_STATUS_COLORS: Record<TripGroupStatus, string> = {
  [TripGroupStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TripGroupStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TripGroupStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TripGroupStatus.CANCELLED]: 'bg-red-100 text-red-800',
};
