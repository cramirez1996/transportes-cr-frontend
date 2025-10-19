import { UserRole } from './enums/user-role.enum';

export interface Role {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isSystem?: boolean;
  permissions?: Permission[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  displayName?: string;
  description?: string;
  createdAt?: Date;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
  role?: Role;
}

export interface TenantUser {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  status: string;
  isOwner: boolean;
  role?: Role;
  tenant?: {
    id: string;
    rut?: string;
    businessName?: string;
    tradeName?: string;
    email?: string;
    phone?: string;
  };
  invitedBy?: string;
  invitedAt?: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  userRoles?: UserRoleAssignment[];
  tenantUsers?: TenantUser[];
}

// Helper functions for User
export function getUserFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export function isUserActive(user: User): boolean {
  return user.status === UserStatus.ACTIVE;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  roleId?: string;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  status?: UserStatus;
}

export interface AssignRoleRequest {
  userId: string;
  tenantId: string;
  roleId: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
