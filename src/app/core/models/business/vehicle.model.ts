export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  type: 'truck' | 'van' | 'pickup';
  capacity: number; // tons
  status: 'available' | 'in_use' | 'maintenance' | 'inactive';
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  mileage: number; // km
  tags: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleDto {
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  type: 'truck' | 'van' | 'pickup';
  capacity: number;
  mileage: number;
  tags?: Record<string, any>;
}
