export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface Tenant {
  id: string;
  businessName: string;
  tradeName?: string;
  rut: string;
  role?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  logo?: string;
  primaryColor?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tenant: Tenant;
  availableTenants: Tenant[];
}

export interface SwitchTenantRequest {
  tenantId: string;
}

export interface SwitchTenantResponse {
  accessToken: string;
  tenant: Tenant;
  role: any;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  status: string;
  role: Role;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
