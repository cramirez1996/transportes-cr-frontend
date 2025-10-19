import { Permission } from './permission.model';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions?: RolePermission[];
}

export interface RolePermission {
  id: string;
  createdAt: Date;
  permission: Permission;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignPermissionsDto {
  permissionIds: string[];
}
