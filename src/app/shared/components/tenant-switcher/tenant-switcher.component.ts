import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Tenant } from '../../../core/models/auth.model';

@Component({
  selector: 'app-tenant-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-switcher.component.html',
  styleUrls: ['./tenant-switcher.component.scss']
})
export class TenantSwitcherComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  tenants$ = this.authService.userTenants$;
  currentTenant$ = this.authService.currentTenant$;
  selectedTenantId: string | null = null;
  isLoading = false;

  ngOnInit(): void {
    // Initialize selected tenant ID from current tenant
    const currentTenant = this.authService.getCurrentTenant();
    if (currentTenant) {
      this.selectedTenantId = currentTenant.id;
    }

    // Subscribe to current tenant changes to keep selector in sync
    this.currentTenant$.subscribe(tenant => {
      if (tenant) {
        this.selectedTenantId = tenant.id;
      }
    });

    this.loadTenants();
  }

  private loadTenants(): void {
    this.authService.fetchUserTenants().subscribe({
      error: (error) => {
        console.error('Error loading tenants:', error);
      }
    });
  }

  onTenantChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newTenantId = selectElement.value;
    const currentTenantId = this.authService.getCurrentTenant()?.id;

    if (newTenantId && newTenantId !== currentTenantId) {
      this.isLoading = true;

      this.authService.switchTenant(newTenantId).subscribe({
        next: () => {
          this.isLoading = false;
          // Redirect to dashboard to reload data with new tenant context
          this.router.navigate(['/admin/dashboard']).then(() => {
            // Force page reload to ensure all components refresh with new tenant data
            window.location.reload();
          });
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
