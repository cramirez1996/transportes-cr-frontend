import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (authService.hasAnyPermission(requiredPermissions)) {
    return true;
  }

  // Redirect to unauthorized page or home
  router.navigate(['/unauthorized']);
  return false;
};
