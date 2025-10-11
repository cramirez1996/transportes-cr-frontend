import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/enums/user-role.enum';

@Component({
  selector: 'app-redirect',
  standalone: true,
  template: ''
})
export class RedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.user();

      if (user && user.role) {
        const userRole = user.role.name;

        if (userRole === UserRole.ADMIN || userRole === UserRole.STAFF || userRole === UserRole.SUPER_ADMIN) {
          this.router.navigate(['/admin/dashboard']);
        } else if (userRole === UserRole.CUSTOMER) {
          this.router.navigate(['/portal/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}
