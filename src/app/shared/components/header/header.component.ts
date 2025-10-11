import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { TenantSwitcherComponent } from '../tenant-switcher/tenant-switcher.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, TenantSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);

  menuToggle = output<void>();
  currentUser = this.authService.currentUser;

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
