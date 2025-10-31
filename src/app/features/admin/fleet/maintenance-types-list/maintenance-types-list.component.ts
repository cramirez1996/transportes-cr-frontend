import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { MaintenanceType, MaintenanceCategory, MaintenanceClass, IntervalType } from '../../../../core/models/maintenance.model';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-maintenance-types-list',
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, PaginationComponent, CustomSelectComponent],
  templateUrl: './maintenance-types-list.component.html',
  styleUrl: './maintenance-types-list.component.scss'
})
export class MaintenanceTypesListComponent implements OnInit, OnDestroy {
  private maintenanceService = inject(MaintenanceService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  maintenanceTypes: MaintenanceType[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Filtros
  filters: {
    category?: MaintenanceCategory;
    maintenanceClass?: MaintenanceClass;
    isActive?: boolean;
    search?: string;
  } = {};

  MaintenanceCategory = MaintenanceCategory;
  MaintenanceClass = MaintenanceClass;

  // Custom select options
  categoryOptions: CustomSelectOption[] = [];
  classOptions: CustomSelectOption[] = [];
  statusOptions: CustomSelectOption[] = [];

  // Paginación
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  ngOnInit(): void {
    this.initializeSelectOptions();
    this.loadMaintenanceTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSelectOptions(): void {
    // Category options
    this.categoryOptions = [
      { value: MaintenanceCategory.ENGINE, label: 'Motor' },
      { value: MaintenanceCategory.TRANSMISSION, label: 'Transmisión' },
      { value: MaintenanceCategory.BRAKES, label: 'Frenos' },
      { value: MaintenanceCategory.SUSPENSION, label: 'Suspensión' },
      { value: MaintenanceCategory.TIRES, label: 'Neumáticos' },
      { value: MaintenanceCategory.ELECTRICAL, label: 'Eléctrico' },
      { value: MaintenanceCategory.COOLING, label: 'Refrigeración' },
      { value: MaintenanceCategory.FUEL, label: 'Combustible' },
      { value: MaintenanceCategory.EXHAUST, label: 'Escape' },
      { value: MaintenanceCategory.BODY, label: 'Carrocería' },
      { value: MaintenanceCategory.LEGAL, label: 'Legal' },
      { value: MaintenanceCategory.OTHER, label: 'Otro' }
    ];

    // Class options
    this.classOptions = [
      { value: MaintenanceClass.PREVENTIVE, label: 'Preventivo' },
      { value: MaintenanceClass.CORRECTIVE, label: 'Correctivo' }
    ];

    // Status options
    this.statusOptions = [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' }
    ];
  }

  loadMaintenanceTypes(): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getMaintenanceTypes(this.filters).subscribe({
      next: (types) => {
        // Aplicar filtro de búsqueda local
        let filteredTypes = types;
        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          filteredTypes = types.filter(t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower)
          );
        }

        this.maintenanceTypes = filteredTypes;
        this.total = filteredTypes.length;
        this.totalPages = Math.ceil(this.total / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los tipos de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadMaintenanceTypes();
  }

  clearFilters(): void {
    this.filters = {};
    this.page = 1;
    this.loadMaintenanceTypes();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.category) count++;
    if (this.filters.maintenanceClass) count++;
    if (this.filters.isActive !== undefined) count++;
    if (this.filters.search) count++;
    return count;
  }

  toggleActive(type: MaintenanceType): void {
    if (confirm(`¿Estás seguro de ${type.isActive ? 'desactivar' : 'activar'} el tipo de mantenimiento "${type.name}"?`)) {
      this.maintenanceService.toggleMaintenanceTypeActive(type.id).subscribe({
        next: () => {
          this.loadMaintenanceTypes();
        },
        error: (err) => {
          console.error('Error al cambiar el estado:', err);
          alert('Error al cambiar el estado del tipo de mantenimiento');
        }
      });
    }
  }

  deleteMaintenanceType(type: MaintenanceType): void {
    if (confirm(`¿Estás seguro de eliminar el tipo de mantenimiento "${type.name}"? Esta acción no se puede deshacer.`)) {
      this.maintenanceService.deleteMaintenanceType(type.id).subscribe({
        next: () => {
          this.loadMaintenanceTypes();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar el tipo de mantenimiento. Es posible que esté siendo usado por registros de mantenimiento.');
        }
      });
    }
  }

  get paginatedTypes(): MaintenanceType[] {
    const startIndex = (this.page - 1) * this.limit;
    return this.maintenanceTypes.slice(startIndex, startIndex + this.limit);
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

  // Badge styling
  getCategoryBadgeClass(category: MaintenanceCategory): string {
    const classes: Record<MaintenanceCategory, string> = {
      [MaintenanceCategory.ENGINE]: 'bg-red-100 text-red-800',
      [MaintenanceCategory.TRANSMISSION]: 'bg-orange-100 text-orange-800',
      [MaintenanceCategory.BRAKES]: 'bg-yellow-100 text-yellow-800',
      [MaintenanceCategory.SUSPENSION]: 'bg-green-100 text-green-800',
      [MaintenanceCategory.TIRES]: 'bg-blue-100 text-blue-800',
      [MaintenanceCategory.ELECTRICAL]: 'bg-indigo-100 text-indigo-800',
      [MaintenanceCategory.COOLING]: 'bg-cyan-100 text-cyan-800',
      [MaintenanceCategory.FUEL]: 'bg-purple-100 text-purple-800',
      [MaintenanceCategory.EXHAUST]: 'bg-pink-100 text-pink-800',
      [MaintenanceCategory.BODY]: 'bg-gray-100 text-gray-800',
      [MaintenanceCategory.LEGAL]: 'bg-teal-100 text-teal-800',
      [MaintenanceCategory.OTHER]: 'bg-gray-100 text-gray-600'
    };
    return classes[category] || 'bg-gray-100 text-gray-800';
  }

  getCategoryLabel(category: MaintenanceCategory): string {
    const labels: Record<MaintenanceCategory, string> = {
      [MaintenanceCategory.ENGINE]: 'Motor',
      [MaintenanceCategory.TRANSMISSION]: 'Transmisión',
      [MaintenanceCategory.BRAKES]: 'Frenos',
      [MaintenanceCategory.SUSPENSION]: 'Suspensión',
      [MaintenanceCategory.TIRES]: 'Neumáticos',
      [MaintenanceCategory.ELECTRICAL]: 'Eléctrico',
      [MaintenanceCategory.COOLING]: 'Refrigeración',
      [MaintenanceCategory.FUEL]: 'Combustible',
      [MaintenanceCategory.EXHAUST]: 'Escape',
      [MaintenanceCategory.BODY]: 'Carrocería',
      [MaintenanceCategory.LEGAL]: 'Legal',
      [MaintenanceCategory.OTHER]: 'Otro'
    };
    return labels[category] || category;
  }

  getClassBadgeClass(maintenanceClass: MaintenanceClass): string {
    return maintenanceClass === MaintenanceClass.PREVENTIVE
      ? 'bg-blue-100 text-blue-800'
      : 'bg-orange-100 text-orange-800';
  }

  getClassLabel(maintenanceClass: MaintenanceClass): string {
    return maintenanceClass === MaintenanceClass.PREVENTIVE ? 'Preventivo' : 'Correctivo';
  }

  getIntervalTypeLabel(intervalType: IntervalType): string {
    const labels: Record<IntervalType, string> = {
      [IntervalType.KILOMETERS]: 'Por kilómetros',
      [IntervalType.MONTHS]: 'Por meses',
      [IntervalType.BOTH]: 'Ambos'
    };
    return labels[intervalType] || intervalType;
  }

  getIntervalDisplay(type: MaintenanceType): string {
    if (!type.intervalType) return 'N/A';

    const parts: string[] = [];
    if (type.intervalKilometers) {
      parts.push(`${type.intervalKilometers.toLocaleString()} km`);
    }
    if (type.intervalMonths) {
      parts.push(`${type.intervalMonths} meses`);
    }
    return parts.length > 0 ? parts.join(' / ') : 'N/A';
  }
}
