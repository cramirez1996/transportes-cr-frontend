# Multi-Tenant Frontend Implementation Guide

## Overview
This document provides implementation details for the multi-tenant frontend features.

## 1. Core Services

###  Auth Service Updates

Add to `frontend/src/app/core/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

interface Tenant {
  id: string;
  businessName: string;
  tradeName?: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
  tenants: Tenant[];
  currentTenant: Tenant;
}

interface SwitchTenantResponse {
  accessToken: string;
  tenant: Tenant;
  role: any;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(null);
  public currentTenant$ = this.currentTenantSubject.asObservable();

  private userTenantsSubject = new BehaviorSubject<Tenant[]>([]);
  public userTenants$ = this.userTenantsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load current tenant from localStorage on init
    const savedTenant = localStorage.getItem('currentTenant');
    if (savedTenant) {
      this.currentTenantSubject.next(JSON.parse(savedTenant));
    }

    const savedTenants = localStorage.getItem('userTenants');
    if (savedTenants) {
      this.userTenantsSubject.next(JSON.parse(savedTenants));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password })
      .pipe(
        tap(response => {
          // Store tokens
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          // Store tenant info
          localStorage.setItem('currentTenant', JSON.stringify(response.currentTenant));
          localStorage.setItem('userTenants', JSON.stringify(response.tenants));

          // Update subjects
          this.currentTenantSubject.next(response.currentTenant);
          this.userTenantsSubject.next(response.tenants);
        })
      );
  }

  switchTenant(tenantId: string): Observable<void> {
    return this.http.post<SwitchTenantResponse>('/api/auth/switch-tenant', { tenantId })
      .pipe(
        tap(response => {
          // Update access token
          localStorage.setItem('accessToken', response.accessToken);

          // Update current tenant
          localStorage.setItem('currentTenant', JSON.stringify(response.tenant));
          this.currentTenantSubject.next(response.tenant);

          // Clear application state
          this.clearApplicationState();
        }),
        map(() => void 0)
      );
  }

  private clearApplicationState(): void {
    // Clear any cached data here
    // This prevents showing data from the previous tenant
    localStorage.removeItem('cachedTrips');
    localStorage.removeItem('cachedCustomers');
    // Add other cached data keys as needed
  }

  getCurrentTenant(): Tenant | null {
    return this.currentTenantSubject.value;
  }

  logout(): void {
    localStorage.clear();
    this.currentTenantSubject.next(null);
    this.userTenantsSubject.next([]);
  }
}
```

## 2. HTTP Interceptor

Create `frontend/src/app/core/interceptors/tenant.interceptor.ts`:

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const currentTenant = this.authService.getCurrentTenant();

    if (currentTenant) {
      // Add tenant ID header to all requests
      request = request.clone({
        setHeaders: {
          'X-Tenant-ID': currentTenant.id
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle tenant mismatch error
        if (error.status === 403 && error.error?.code === 'TENANT_MISMATCH') {
          // Log out user and redirect to login
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
```

Register in `app.config.ts` or your providers:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TenantInterceptor } from './core/interceptors/tenant.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true
    }
  ]
};
```

## 3. Tenant Switcher Component

Create `frontend/src/app/shared/components/tenant-switcher/tenant-switcher.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

interface Tenant {
  id: string;
  businessName: string;
  tradeName?: string;
  role: string;
}

@Component({
  selector: 'app-tenant-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tenant-switcher" *ngIf="(tenants$ | async) as tenants">
      <select
        [value]="(currentTenant$ | async)?.id"
        (change)="onTenantChange($event)"
        class="tenant-select"
      >
        <option *ngFor="let tenant of tenants" [value]="tenant.id">
          {{ tenant.businessName }}
          <span *ngIf="tenant.tradeName"> ({{ tenant.tradeName }})</span>
        </option>
      </select>
    </div>
  `,
  styles: [`
    .tenant-switcher {
      display: inline-block;
    }

    .tenant-select {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background-color: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tenant-select:hover {
      border-color: #cbd5e0;
    }

    .tenant-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  `]
})
export class TenantSwitcherComponent implements OnInit {
  tenants$ = this.authService.userTenants$;
  currentTenant$ = this.authService.currentTenant$;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onTenantChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newTenantId = selectElement.value;
    const currentTenantId = this.authService.getCurrentTenant()?.id;

    if (newTenantId && newTenantId !== currentTenantId) {
      this.isLoading = true;

      this.authService.switchTenant(newTenantId).subscribe({
        next: () => {
          this.isLoading = false;
          // Redirect to dashboard to reload data
          this.router.navigate(['/admin/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error switching tenant:', error);
          alert('Error al cambiar de empresa. Por favor intente nuevamente.');
        }
      });
    }
  }
}
```

## 4. Add to Navbar

Update your navbar component to include the tenant switcher:

```typescript
// In your navbar.component.html
<nav class="navbar">
  <!-- ... other navbar items ... -->

  <app-tenant-switcher></app-tenant-switcher>

  <!-- ... user menu, etc ... -->
</nav>
```

Import in your navbar component:

```typescript
import { TenantSwitcherComponent } from '../../shared/components/tenant-switcher/tenant-switcher.component';

@Component({
  // ...
  imports: [CommonModule, RouterModule, TenantSwitcherComponent],
})
export class NavbarComponent {}
```

## 5. Route Guard (Optional)

Create a guard to ensure user has a tenant selected:

```typescript
// frontend/src/app/core/guards/tenant.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const tenantGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentTenant = authService.getCurrentTenant();

  if (!currentTenant) {
    router.navigate(['/select-tenant']);
    return false;
  }

  return true;
};
```

## 6. Testing

### Test Tenant Switching:

1. Login with a user that belongs to multiple tenants
2. Open browser DevTools → Network tab
3. Switch tenant using the dropdown
4. Verify:
   - POST request to `/api/auth/switch-tenant`
   - New `accessToken` in localStorage
   - `X-Tenant-ID` header in subsequent requests
   - Dashboard reloads with new tenant data

### Test Tenant Isolation:

1. Login as Tenant A
2. Note a resource ID (e.g., vehicle ID)
3. Switch to Tenant B
4. Try to access Tenant A's resource via API
5. Should receive 404 or empty result (RLS blocks it)

## 7. Important Notes

- **Never trust frontend validation alone**: Backend RLS is the real security
- **Clear state on switch**: Always clear cached data when switching tenants
- **Handle errors gracefully**: If switch fails, don't leave user in broken state
- **Loading indicators**: Show loading while switching (data reload can take time)
- **Refresh token**: Refresh tokens are tenant-agnostic (user-level)
