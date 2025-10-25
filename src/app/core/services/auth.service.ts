import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  LoginResponse,
  User,
  TokenResponse,
  Tenant,
  SwitchTenantRequest,
  SwitchTenantResponse,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';
  private readonly CURRENT_TENANT_KEY = 'current_tenant';
  private readonly USER_TENANTS_KEY = 'user_tenants';

  // Signals para estado reactivo
  private userSignal = signal<User | null>(this.getUserFromStorage());
  private isAuthenticatedSignal = signal<boolean>(!!this.getToken());
  private isLoadingSignal = signal<boolean>(false);

  // Computed signals públicos
  user = this.userSignal.asReadonly();
  currentUser = this.userSignal.asReadonly(); // Alias para compatibilidad
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();

  // BehaviorSubject para compatibilidad con observables
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  // Multi-tenant support
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(this.getTenantFromStorage());
  public currentTenant$ = this.currentTenantSubject.asObservable();

  private userTenantsSubject = new BehaviorSubject<Tenant[]>(this.getTenantsFromStorage());
  public userTenants$ = this.userTenantsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.setSession(response);
        // Store tenant information
        if (response.tenant) {
          this.setCurrentTenant(response.tenant);
          this.currentTenantSubject.next(response.tenant);
        }
        if (response.availableTenants) {
          this.setUserTenants(response.availableTenants);
          this.userTenantsSubject.next(response.availableTenants);
        }
        this.isAuthenticatedSignal.set(true);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Registrar nuevo usuario
   */
  register(data: RegisterRequest): Observable<User> {
    this.isLoadingSignal.set(true);

    return this.http.post<User>(`${this.API_URL}/register`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Cerrar sesión
   */
  logout(refreshToken?: string): Observable<any> {
    const token = refreshToken || this.getRefreshToken();

    return this.http.post(`${this.API_URL}/logout`, { refreshToken: token }).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      }),
      catchError((error) => {
        // Aunque falle, limpiamos la sesión local
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Refrescar token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.setToken(response.accessToken);
          this.setRefreshToken(response.refreshToken);
        }),
        catchError((error) => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, data);
  }

  /**
   * Validar token de recuperación de contraseña
   */
  validateResetToken(token: string): Observable<{ valid: boolean; expiresAt: Date }> {
    return this.http.post<{ valid: boolean; expiresAt: Date }>(
      `${this.API_URL}/validate-reset-token`,
      { token }
    );
  }

  /**
   * Restablecer contraseña
   */
  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, data);
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/change-password`, data);
  }

  /**
   * Obtener información del usuario autenticado
   */
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        this.userSubject.next(user);
        this.setUser(user);
      }),
    );
  }

  /**
   * Validar token
   */
  validateToken(token: string): Observable<{ valid: boolean; userId?: string }> {
    return this.http.post<{ valid: boolean; userId?: string }>(
      `${this.API_URL}/validate-token`,
      { token },
    );
  }

  /**
   * Switch tenant - Cambiar de empresa/tenant
   */
  switchTenant(tenantId: string): Observable<void> {
    return this.http.post<SwitchTenantResponse>(`${this.API_URL}/switch-tenant`, { tenantId }).pipe(
      tap((response) => {
        // Update access token with new tenant context
        this.setToken(response.accessToken);

        // Update current tenant
        this.setCurrentTenant(response.tenant);
        this.currentTenantSubject.next(response.tenant);

        // Clear application state to prevent data leakage
        this.clearApplicationState();
      }),
      map(() => void 0)
    );
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenantSubject.value;
  }

  /**
   * Get all user's tenants
   */
  getUserTenants(): Tenant[] {
    return this.userTenantsSubject.value;
  }

  /**
   * Fetch user tenants from API
   */
  fetchUserTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${environment.apiUrl}/tenants/my-tenants`).pipe(
      tap((tenants) => {
        this.setUserTenants(tenants);
        this.userTenantsSubject.next(tenants);
      })
    );
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string | string[]): boolean {
    const user = this.userSignal();
    if (!user || !user.role) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role.name);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.userSignal();
    return user?.role ? roles.includes(user.role.name) : false;
  }

  /**
   * Verificar si el usuario tiene todos los roles especificados
   * Note: In single-role architecture, this checks if user has the role (only one can match)
   */
  hasAllRoles(roles: string[]): boolean {
    const user = this.userSignal();
    if (!user?.role || roles.length === 0) return false;
    // In single role system, only returns true if exactly one role is requested and matches
    return roles.length === 1 && roles[0] === user.role.name;
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const user = this.userSignal();
    return user?.permissions.includes(permission) ?? false;
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.userSignal();
    return permissions.some((p) => user?.permissions.includes(p));
  }

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: string[]): boolean {
    const user = this.userSignal();
    return permissions.every((p) => user?.permissions.includes(p));
  }

  /**
   * Obtener token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Guardar token de acceso
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Guardar refresh token
   */
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Guardar usuario
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtener usuario del almacenamiento
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Establecer sesión completa
   */
  private setSession(authResult: LoginResponse): void {
    this.setToken(authResult.accessToken);
    this.setRefreshToken(authResult.refreshToken);
    this.setUser(authResult.user);
    this.userSignal.set(authResult.user);
    this.userSubject.next(authResult.user);
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.CURRENT_TENANT_KEY);
    localStorage.removeItem(this.USER_TENANTS_KEY);
    this.userSignal.set(null);
    this.userSubject.next(null);
    this.currentTenantSubject.next(null);
    this.userTenantsSubject.next([]);
    this.isAuthenticatedSignal.set(false);
  }

  /**
   * Limpiar sesión y redirigir (sin llamar al endpoint de logout)
   * Usado cuando el logout es automático por token expirado
   */
  clearSessionAndRedirect(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Set current tenant
   */
  private setCurrentTenant(tenant: Tenant): void {
    localStorage.setItem(this.CURRENT_TENANT_KEY, JSON.stringify(tenant));
  }

  /**
   * Set user tenants
   */
  private setUserTenants(tenants: Tenant[]): void {
    localStorage.setItem(this.USER_TENANTS_KEY, JSON.stringify(tenants));
  }

  /**
   * Get tenant from storage
   */
  private getTenantFromStorage(): Tenant | null {
    const tenantJson = localStorage.getItem(this.CURRENT_TENANT_KEY);
    return tenantJson ? JSON.parse(tenantJson) : null;
  }

  /**
   * Get tenants from storage
   */
  private getTenantsFromStorage(): Tenant[] {
    const tenantsJson = localStorage.getItem(this.USER_TENANTS_KEY);
    return tenantsJson ? JSON.parse(tenantsJson) : [];
  }

  /**
   * Clear application state - prevents data leakage when switching tenants
   */
  private clearApplicationState(): void {
    // Clear any cached data that should not persist across tenant switches
    // Add more keys as needed for your application
    const keysToRemove = [
      'cached_trips',
      'cached_customers',
      'cached_vehicles',
      'cached_drivers',
      'cached_invoices',
      'cached_transactions',
      'dashboard_data',
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
