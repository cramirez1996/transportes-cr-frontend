import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, PermissionFilters, PermissionAction, GroupedPermissions } from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly apiUrl = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Get all permissions (optionally filtered)
   */
  findAll(filters?: PermissionFilters): Observable<Permission[]> {
    let params = new HttpParams();

    if (filters?.resource) {
      params = params.set('resource', filters.resource);
    }

    if (filters?.action) {
      params = params.set('action', filters.action);
    }

    return this.http.get<Permission[]>(this.apiUrl, { params });
  }

  /**
   * Get permissions grouped by resource
   */
  findGroupedByResource(): Observable<GroupedPermissions> {
    return this.http.get<GroupedPermissions>(`${this.apiUrl}/grouped`);
  }

  /**
   * Get all available resources
   */
  getResources(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/resources`);
  }

  /**
   * Get all available actions
   */
  getActions(): Observable<PermissionAction[]> {
    return this.http.get<PermissionAction[]>(`${this.apiUrl}/actions`);
  }

  /**
   * Get permissions by resource
   */
  findByResource(resource: string): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/resource/${resource}`);
  }

  /**
   * Get a single permission by ID
   */
  findOne(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/${id}`);
  }
}
