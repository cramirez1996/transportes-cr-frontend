import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

interface VehicleMaintenancePlan {
  id: string;
  vehicle: Vehicle;
  maintenanceType: any;
  isEnabled: boolean;
  customIntervalKm: number | null;
  customIntervalMonths: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-vehicle-maintenance-plans-list',
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, PaginationComponent, CustomSelectComponent],
  templateUrl: './vehicle-maintenance-plans-list.component.html',
  styleUrl: './vehicle-maintenance-plans-list.component.scss'
})
export class VehicleMaintenancePlansListComponent implements OnInit, OnDestroy {
  private maintenanceService = inject(MaintenanceService);
  private vehicleService = inject(VehicleService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  plans: VehicleMaintenancePlan[] = [];
  vehicles: Vehicle[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Filtros
  filters: {
    vehicleId?: string;
    isEnabled?: boolean;
    search?: string;
  } = {};

  // Custom select options
  vehicleOptions: CustomSelectOption[] = [];
  statusOptions: CustomSelectOption[] = [];

  // Paginación
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  ngOnInit(): void {
    this.initializeSelectOptions();
    this.loadVehicles();
    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSelectOptions(): void {
    // Status options
    this.statusOptions = [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' }
    ];
  }

  private loadVehicles(): void {
    this.vehicleService.getVehicles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles;
          this.vehicleOptions = vehicles.map(v => ({
            value: v.id,
            label: v.licensePlate,
            searchableText: `${v.licensePlate} ${v.brand} ${v.model}`,
            data: { brand: v.brand, model: v.model, type: v.type }
          }));
        },
        error: (err) => console.error('Error loading vehicles:', err)
      });
  }

  loadPlans(): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getVehicleMaintenances(this.filters).subscribe({
      next: (plans) => {
        // Aplicar filtro de búsqueda local
        let filteredPlans = plans;
        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          filteredPlans = plans.filter(p =>
            p.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
            p.maintenanceType?.name?.toLowerCase().includes(searchLower) ||
            p.notes?.toLowerCase().includes(searchLower)
          );
        }

        this.plans = filteredPlans;
        this.total = filteredPlans.length;
        this.totalPages = Math.ceil(this.total / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los planes de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadPlans();
  }

  clearFilters(): void {
    this.filters = {};
    this.page = 1;
    this.loadPlans();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.vehicleId) count++;
    if (this.filters.isEnabled !== undefined) count++;
    if (this.filters.search) count++;
    return count;
  }

  toggleEnabled(plan: VehicleMaintenancePlan): void {
    if (confirm(`¿Estás seguro de ${plan.isEnabled ? 'desactivar' : 'activar'} el plan de mantenimiento para "${plan.vehicle.licensePlate} - ${plan.maintenanceType.name}"?`)) {
      this.maintenanceService.toggleVehicleMaintenanceEnabled(plan.id).subscribe({
        next: () => {
          this.loadPlans();
        },
        error: (err) => {
          console.error('Error al cambiar el estado:', err);
          alert('Error al cambiar el estado del plan de mantenimiento');
        }
      });
    }
  }

  deletePlan(plan: VehicleMaintenancePlan): void {
    if (confirm(`¿Estás seguro de eliminar el plan de mantenimiento para "${plan.vehicle.licensePlate} - ${plan.maintenanceType.name}"? Esta acción no se puede deshacer.`)) {
      this.maintenanceService.deleteVehicleMaintenance(plan.id).subscribe({
        next: () => {
          this.loadPlans();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar el plan de mantenimiento.');
        }
      });
    }
  }

  get paginatedPlans(): VehicleMaintenancePlan[] {
    const startIndex = (this.page - 1) * this.limit;
    return this.plans.slice(startIndex, startIndex + this.limit);
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.page = Number(page);
  }

  onLimitChange(limit: number): void {
    this.limit = Number(limit);
    this.page = 1;
    this.totalPages = Math.ceil(this.total / this.limit);
  }

  // Helper methods
  getEffectiveIntervalKm(plan: VehicleMaintenancePlan): number | null {
    return plan.customIntervalKm ?? plan.maintenanceType?.intervalKilometers ?? null;
  }

  getEffectiveIntervalMonths(plan: VehicleMaintenancePlan): number | null {
    return plan.customIntervalMonths ?? plan.maintenanceType?.intervalMonths ?? null;
  }

  getIntervalDisplay(plan: VehicleMaintenancePlan): string {
    const km = this.getEffectiveIntervalKm(plan);
    const months = this.getEffectiveIntervalMonths(plan);

    const parts: string[] = [];
    if (km) {
      const isCustom = plan.customIntervalKm !== null;
      parts.push(`${km.toLocaleString()} km${isCustom ? ' *' : ''}`);
    }
    if (months) {
      const isCustom = plan.customIntervalMonths !== null;
      parts.push(`${months} meses${isCustom ? ' *' : ''}`);
    }

    return parts.length > 0 ? parts.join(' / ') : 'N/A';
  }

  hasCustomInterval(plan: VehicleMaintenancePlan): boolean {
    return plan.customIntervalKm !== null || plan.customIntervalMonths !== null;
  }

  getVehicleDisplayName(vehicle: Vehicle): string {
    return `${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model}`;
  }
}
