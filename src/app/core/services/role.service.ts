import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Get all roles with their permissions
   */
  findAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  /**
   * Get a single role by ID with permissions
   */
  findOne(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all permissions for a specific role
   */
  getRolePermissions(id: string): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/${id}/permissions`);
  }

  /**
   * Create a new custom role
   */
  create(createRoleDto: CreateRoleDto): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, createRoleDto);
  }

  /**
   * Update a custom role
   */
  update(id: string, updateRoleDto: UpdateRoleDto): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, updateRoleDto);
  }

  /**
   * Delete a custom role
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Assign permissions to a role
   */
  assignPermissions(id: string, permissionIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/permissions`, { permissionIds });
  }

  /**
   * Remove permissions from a role
   */
  removePermissions(id: string, permissionIds: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permissions`, {
      body: { permissionIds }
    });
  }

  /**
   * Get all users assigned to a specific role
   */
  getRoleUsers(id: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${id}/users`);
  }
}
