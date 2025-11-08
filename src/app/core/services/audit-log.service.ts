import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditLog,
  AuditLogFilters,
  PaginatedAuditLogs,
  AuditLogStatistics,
} from '../models/audit-log.model';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly apiUrl = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all audit logs with filters and pagination
   */
  getAuditLogs(filters: AuditLogFilters = {}): Observable<PaginatedAuditLogs> {
    let params = new HttpParams();

    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.resource) params = params.set('resource', filters.resource);
    if (filters.resourceId) params = params.set('resourceId', filters.resourceId);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.success !== undefined) params = params.set('success', String(filters.success));
    if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters.toDate) params = params.set('toDate', filters.toDate);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<PaginatedAuditLogs>(this.apiUrl, { params });
  }

  /**
   * Get a single audit log by ID
   */
  getAuditLogById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all audit logs for a specific user
   */
  getAuditLogsByUser(userId: string, limit?: number): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', String(limit));

    return this.http.get<AuditLog[]>(`${this.apiUrl}/user/${userId}`, { params });
  }

  /**
   * Get all audit logs for a specific resource
   */
  getAuditLogsByResource(resource: string, resourceId?: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (resourceId) params = params.set('resourceId', resourceId);

    return this.http.get<AuditLog[]>(`${this.apiUrl}/resource/${resource}`, { params });
  }

  /**
   * Get all audit logs by action type
   */
  getAuditLogsByAction(action: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/action/${action}`);
  }

  /**
   * Get audit log statistics
   */
  getStatistics(): Observable<AuditLogStatistics> {
    return this.http.get<AuditLogStatistics>(`${this.apiUrl}/stats/summary`);
  }

  /**
   * Get available resource types (for filter dropdown)
   */
  getResourceTypes(): string[] {
    return [
      'customer',
      'invoice',
      'trip',
      'vehicle',
      'driver',
      'supplier',
      'transaction',
      'user',
    ];
  }

  /**
   * Get available action types (for filter dropdown)
   */
  getActionTypes(): string[] {
    return ['CREATE', 'UPDATE', 'DELETE', 'INSERT'];
  }

  /**
   * Format action for display
   */
  formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      CREATE: 'Crear',
      UPDATE: 'Actualizar',
      DELETE: 'Eliminar',
      INSERT: 'Insertar',
      change_status: 'Cambiar Estado',
      bulk_upload_xml: 'Carga Masiva XML',
    };

    return actionMap[action] || action;
  }

  /**
   * Format resource for display
   */
  formatResource(resource: string): string {
    const resourceMap: Record<string, string> = {
      customer: 'Cliente',
      invoice: 'Factura',
      trip: 'Viaje',
      vehicle: 'Vehículo',
      driver: 'Conductor',
      supplier: 'Proveedor',
      transaction: 'Transacción',
      user: 'Usuario',
    };

    return resourceMap[resource] || resource;
  }
}
