import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums/user-role.enum';

export const redirectIfAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.user();

    if (user && user.role) {
      const userRole = user.role.name;

      if (userRole === UserRole.ADMIN || userRole === UserRole.STAFF || userRole === UserRole.SUPER_ADMIN) {
        router.navigate(['/admin/dashboard']);
        return false;
      } else if (userRole === UserRole.CUSTOMER) {
        router.navigate(['/portal/dashboard']);
        return false;
      }
    }
  }

  return true;
};
