import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * TenantInterceptor
 *
 * Adds X-Tenant-ID header to all HTTP requests
 * Handles tenant mismatch errors
 */
export const tenantInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentTenant = authService.getCurrentTenant();

  // Clone request and add tenant ID header if tenant is selected
  let request = req;
  if (currentTenant) {
    request = req.clone({
      setHeaders: {
        'X-Tenant-ID': currentTenant.id
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle tenant mismatch error
      if (error.status === 403 && error.error?.code === 'TENANT_MISMATCH') {
        // Log out user and redirect to login
        console.error('Tenant mismatch detected. Logging out...');
        authService.clearSessionAndRedirect();
      }

      return throwError(() => error);
    })
  );
};
