export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceCategory {
  ENGINE = 'ENGINE',
  TRANSMISSION = 'TRANSMISSION',
  BRAKES = 'BRAKES',
  SUSPENSION = 'SUSPENSION',
  TIRES = 'TIRES',
  ELECTRICAL = 'ELECTRICAL',
  COOLING = 'COOLING',
  FUEL = 'FUEL',
  EXHAUST = 'EXHAUST',
  BODY = 'BODY',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

export enum MaintenanceClass {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export enum IntervalType {
  KILOMETERS = 'KILOMETERS',
  MONTHS = 'MONTHS',
  BOTH = 'BOTH',
}

export enum AlertType {
  KILOMETERS = 'KILOMETERS',
  DATE = 'DATE',
  OVERDUE = 'OVERDUE',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface MaintenanceType {
  id: string;
  name: string;
  description?: string;
  category: MaintenanceCategory;
  maintenanceClass: MaintenanceClass;
  intervalType?: IntervalType;
  intervalKilometers?: number;
  intervalMonths?: number;
  alertBeforeKm?: number;
  alertBeforeDays?: number;
  isMandatory: boolean;
  estimatedCost?: number;
  estimatedDurationHours?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  tenantId: string;
  vehicle: {
    id: string;
    licensePlate: string;
    brand?: string;
    model?: string;
  };
  maintenanceType: MaintenanceType;
  maintenanceClass: MaintenanceClass;
  scheduledDate?: Date;
  executedDate: Date;
  vehicleKmAtMaintenance: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: Date;
  status: MaintenanceStatus;
  cost?: number;
  supplier?: {
    id: string;
    name: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
  transaction?: {
    id: string;
    amount: number;
  };
  performedBy?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceAlert {
  id: string;
  tenantId: string;
  vehicle: {
    id: string;
    licensePlate: string;
  };
  maintenanceType: MaintenanceType;
  lastMaintenance?: MaintenanceRecord;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  currentKm?: number;
  dueKm?: number;
  dueDate?: Date;
  daysRemaining?: number;
  kmRemaining?: number;
  isDismissed: boolean;
  dismissedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceRecordDto {
  vehicleId: string;
  maintenanceTypeId: string;
  maintenanceClass: MaintenanceClass;
  scheduledDate?: Date;
  executedDate: Date;
  vehicleKmAtMaintenance: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: Date;
  status: MaintenanceStatus;
  cost?: number;
  supplierId?: string;
  invoiceId?: string;
  transactionId?: string;
  performedBy?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
}

export interface UpdateMaintenanceRecordDto extends Partial<CreateMaintenanceRecordDto> {}
