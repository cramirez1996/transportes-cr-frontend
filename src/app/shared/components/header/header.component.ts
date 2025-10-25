import { Component, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { DropdownItemComponent } from '../dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../dropdown-divider/dropdown-divider.component';
import { CustomSelectComponent, CustomSelectOption } from '../custom-select/custom-select.component';
import { Tenant } from '../../../core/models/auth.model';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AvatarComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    CustomSelectComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  menuToggle = output<void>();
  currentUser = this.authService.currentUser;

  tenantControl = new FormControl<string>('');
  tenantOptions: CustomSelectOption[] = [];
  isLoadingTenant = false;

  ngOnInit(): void {
    this.loadTenants();

    // Set initial tenant value
    const currentTenant = this.authService.getCurrentTenant();
    if (currentTenant) {
      this.tenantControl.setValue(currentTenant.id, { emitEvent: false });
    }

    // Subscribe to tenant control changes
    this.tenantControl.valueChanges.subscribe(tenantId => {
      if (tenantId) {
        this.onTenantChange(tenantId);
      }
    });
  }

  private loadTenants(): void {
    this.authService.fetchUserTenants().subscribe({
      next: (tenants) => {
        this.tenantOptions = tenants.map(tenant => ({
          value: tenant.id,
          label: tenant.businessName,
          data: {
            tradeName: tenant.tradeName,
            rut: tenant.rut,
            initials: this.getInitials(tenant.businessName)
          }
        }));
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
      }
    });
  }

  private getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  private onTenantChange(newTenantId: string): void {
    const currentTenantId = this.authService.getCurrentTenant()?.id;

    if (newTenantId && newTenantId !== currentTenantId) {
      this.isLoadingTenant = true;
      this.tenantControl.disable();

      this.authService.switchTenant(newTenantId).subscribe({
        next: () => {
          this.isLoadingTenant = false;
          this.tenantControl.enable();
          // Redirect to dashboard to reload data with new tenant context
          this.router.navigate(['/admin/dashboard']).then(() => {
            // Force page reload to ensure all components refresh with new tenant data
            window.location.reload();
          });
        },
        error: (error) => {
          this.isLoadingTenant = false;
          this.tenantControl.enable();
          console.error('Error switching tenant:', error);
          alert('Error al cambiar de empresa. Por favor intente nuevamente.');
        }
      });
    }
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful - AuthService handles navigation
      },
      error: (error) => {
        // Even on error, AuthService clears session and navigates
        console.error('Error during logout:', error);
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  goToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }
}
