import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceAlert,
  CreateMaintenanceRecordDto,
  UpdateMaintenanceRecordDto,
  MaintenanceStatus,
} from '../models/maintenance.model';
import { environment } from '../../../environments/environment';

export interface MaintenanceFilters {
  vehicleId?: string;
  maintenanceTypeId?: string;
  status?: MaintenanceStatus;
  startDate?: Date;
  endDate?: Date;
  maintenanceClass?: string;
  minCost?: number;
  maxCost?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance-records`;
  private typesApiUrl = `${environment.apiUrl}/maintenance-types`;
  private alertsApiUrl = `${environment.apiUrl}/maintenance-alerts`;
  private vehicleMaintenancesApiUrl = `${environment.apiUrl}/vehicle-maintenances`;

  // Maintenance Records CRUD
  getMaintenanceRecords(filters?: MaintenanceFilters): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.maintenanceTypeId) params = params.set('maintenanceTypeId', filters.maintenanceTypeId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(records => records.map(record => this.mapMaintenanceRecordFromBackend(record)))
    );
  }

  getMaintenanceRecordById(id: string): Observable<MaintenanceRecord> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(record => this.mapMaintenanceRecordFromBackend(record))
    );
  }

  createMaintenanceRecord(recordData: CreateMaintenanceRecordDto): Observable<MaintenanceRecord> {
    const payload = this.mapMaintenanceRecordToBackend(recordData);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(record => this.mapMaintenanceRecordFromBackend(record))
    );
  }

  updateMaintenanceRecord(id: string, recordData: UpdateMaintenanceRecordDto): Observable<MaintenanceRecord> {
    const payload = this.mapMaintenanceRecordToBackend(recordData);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(record => this.mapMaintenanceRecordFromBackend(record))
    );
  }

  deleteMaintenanceRecord(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Maintenance Types
  getMaintenanceTypes(filters?: { category?: string; maintenanceClass?: string; isActive?: boolean }): Observable<MaintenanceType[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.maintenanceClass) params = params.set('maintenanceClass', filters.maintenanceClass);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
    }

    return this.http.get<any[]>(this.typesApiUrl, { params }).pipe(
      map(types => types.map(type => this.mapMaintenanceTypeFromBackend(type)))
    );
  }

  getMaintenanceTypeById(id: string): Observable<MaintenanceType> {
    return this.http.get<any>(`${this.typesApiUrl}/${id}`).pipe(
      map(type => this.mapMaintenanceTypeFromBackend(type))
    );
  }

  createMaintenanceType(typeData: any): Observable<MaintenanceType> {
    return this.http.post<any>(this.typesApiUrl, typeData).pipe(
      map(type => this.mapMaintenanceTypeFromBackend(type))
    );
  }

  updateMaintenanceType(id: string, typeData: any): Observable<MaintenanceType> {
    return this.http.patch<any>(`${this.typesApiUrl}/${id}`, typeData).pipe(
      map(type => this.mapMaintenanceTypeFromBackend(type))
    );
  }

  toggleMaintenanceTypeActive(id: string): Observable<MaintenanceType> {
    return this.http.patch<any>(`${this.typesApiUrl}/${id}/toggle-active`, {}).pipe(
      map(type => this.mapMaintenanceTypeFromBackend(type))
    );
  }

  deleteMaintenanceType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.typesApiUrl}/${id}`);
  }

  // Vehicle Maintenances (Maintenance Plans)
  getVehicleMaintenances(filters?: { vehicleId?: string; isEnabled?: boolean }): Observable<any[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.isEnabled !== undefined) params = params.set('isEnabled', filters.isEnabled.toString());
    }

    return this.http.get<any[]>(this.vehicleMaintenancesApiUrl, { params });
  }

  getVehicleMaintenanceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.vehicleMaintenancesApiUrl}/${id}`);
  }

  getVehicleMaintenancesByVehicle(vehicleId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.vehicleMaintenancesApiUrl}/vehicle/${vehicleId}`);
  }

  createVehicleMaintenance(data: any): Observable<any> {
    return this.http.post<any>(this.vehicleMaintenancesApiUrl, data);
  }

  updateVehicleMaintenance(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.vehicleMaintenancesApiUrl}/${id}`, data);
  }

  toggleVehicleMaintenanceEnabled(id: string): Observable<any> {
    return this.http.patch<any>(`${this.vehicleMaintenancesApiUrl}/${id}/toggle-enabled`, {});
  }

  deleteVehicleMaintenance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.vehicleMaintenancesApiUrl}/${id}`);
  }

  // Maintenance Alerts
  getMaintenanceAlerts(filters?: { vehicleId?: string; isDismissed?: boolean }): Observable<MaintenanceAlert[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.isDismissed !== undefined) params = params.set('isDismissed', filters.isDismissed.toString());
    }

    return this.http.get<any[]>(this.alertsApiUrl, { params }).pipe(
      map(alerts => alerts.map(alert => this.mapMaintenanceAlertFromBackend(alert)))
    );
  }

  dismissAlert(id: string): Observable<MaintenanceAlert> {
    return this.http.patch<any>(`${this.alertsApiUrl}/${id}/dismiss`, {}).pipe(
      map(alert => this.mapMaintenanceAlertFromBackend(alert))
    );
  }

  // Mappers
  private mapMaintenanceRecordFromBackend(record: any): MaintenanceRecord {
    return {
      id: record.id,
      tenantId: record.tenantId,
      vehicle: record.vehicle,
      maintenanceType: this.mapMaintenanceTypeFromBackend(record.maintenanceType),
      maintenanceClass: record.maintenanceClass,
      scheduledDate: record.scheduledDate ? new Date(record.scheduledDate) : undefined,
      executedDate: new Date(record.executedDate),
      vehicleKmAtMaintenance: record.vehicleKmAtMaintenance,
      nextMaintenanceKm: record.nextMaintenanceKm,
      nextMaintenanceDate: record.nextMaintenanceDate ? new Date(record.nextMaintenanceDate) : undefined,
      status: record.status,
      cost: record.cost ? parseFloat(record.cost) : undefined,
      supplier: record.supplier,
      invoice: record.invoice,
      transaction: record.transaction,
      performedBy: record.performedBy,
      description: record.description,
      notes: record.notes,
      attachments: record.attachments || [],
      createdBy: record.createdBy,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }

  private mapMaintenanceRecordToBackend(recordData: CreateMaintenanceRecordDto | UpdateMaintenanceRecordDto): any {
    const payload: any = { ...recordData };

    if (recordData.scheduledDate) {
      payload.scheduledDate = recordData.scheduledDate instanceof Date
        ? recordData.scheduledDate.toISOString().split('T')[0]
        : recordData.scheduledDate;
    }

    if (recordData.executedDate) {
      payload.executedDate = recordData.executedDate instanceof Date
        ? recordData.executedDate.toISOString().split('T')[0]
        : recordData.executedDate;
    }

    if (recordData.nextMaintenanceDate) {
      payload.nextMaintenanceDate = recordData.nextMaintenanceDate instanceof Date
        ? recordData.nextMaintenanceDate.toISOString().split('T')[0]
        : recordData.nextMaintenanceDate;
    }

    return payload;
  }

  private mapMaintenanceTypeFromBackend(type: any): MaintenanceType {
    return {
      id: type.id,
      name: type.name,
      description: type.description,
      category: type.category,
      maintenanceClass: type.maintenanceClass,
      intervalType: type.intervalType,
      intervalKilometers: type.intervalKilometers,
      intervalMonths: type.intervalMonths,
      alertBeforeKm: type.alertBeforeKm,
      alertBeforeDays: type.alertBeforeDays,
      isMandatory: type.isMandatory,
      estimatedCost: type.estimatedCost ? parseFloat(type.estimatedCost) : undefined,
      estimatedDurationHours: type.estimatedDurationHours ? parseFloat(type.estimatedDurationHours) : undefined,
      isActive: type.isActive,
      createdAt: new Date(type.createdAt),
      updatedAt: new Date(type.updatedAt),
    };
  }

  private mapMaintenanceAlertFromBackend(alert: any): MaintenanceAlert {
    return {
      id: alert.id,
      tenantId: alert.tenantId,
      vehicle: alert.vehicle,
      maintenanceType: this.mapMaintenanceTypeFromBackend(alert.maintenanceType),
      lastMaintenance: alert.lastMaintenance ? this.mapMaintenanceRecordFromBackend(alert.lastMaintenance) : undefined,
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      currentKm: alert.currentKm,
      dueKm: alert.dueKm,
      dueDate: alert.dueDate ? new Date(alert.dueDate) : undefined,
      daysRemaining: alert.daysRemaining,
      kmRemaining: alert.kmRemaining,
      isDismissed: alert.isDismissed,
      dismissedBy: alert.dismissedBy,
      dismissedAt: alert.dismissedAt ? new Date(alert.dismissedAt) : undefined,
      createdAt: new Date(alert.createdAt),
      updatedAt: new Date(alert.updatedAt),
    };
  }
}
