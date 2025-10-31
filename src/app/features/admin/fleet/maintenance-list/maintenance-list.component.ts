import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MaintenanceService, MaintenanceFilters } from '../../../../core/services/maintenance.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceClass, MaintenanceType } from '../../../../core/models/maintenance.model';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';
import { MaintenanceChangeStatusModalComponent } from '../maintenance-change-status-modal/maintenance-change-status-modal.component';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-maintenance-list',
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, PaginationComponent, CustomSelectComponent],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent implements OnInit, OnDestroy {
  private maintenanceService = inject(MaintenanceService);
  private vehicleService = inject(VehicleService);
  private modalService = inject(ModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  maintenanceRecords: MaintenanceRecord[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Filtros
  filters: MaintenanceFilters = {};
  MaintenanceStatus = MaintenanceStatus;
  MaintenanceClass = MaintenanceClass;

  // Advanced filters toggle
  showAdvancedFilters = false;

  // Options for filters
  vehicles: Vehicle[] = [];
  maintenanceTypes: MaintenanceType[] = [];

  // Custom select options
  statusOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  maintenanceTypeOptions: CustomSelectOption[] = [];
  classOptions: CustomSelectOption[] = [];

  // Paginación
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  // Sorting
  sortBy: string = 'executedDate';
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Active filters count
  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.status) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.vehicleId) count++;
    if (this.filters.maintenanceTypeId) count++;
    if (this.filters.maintenanceClass) count++;
    if (this.filters.minCost) count++;
    if (this.filters.maxCost) count++;
    return count;
  }

  ngOnInit(): void {
    this.initializeSelectOptions();
    this.loadSelectOptions();
    this.loadMaintenanceRecords();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSelectOptions(): void {
    // Status options
    this.statusOptions = [
      { value: MaintenanceStatus.SCHEDULED, label: 'Programado' },
      { value: MaintenanceStatus.COMPLETED, label: 'Completado' },
      { value: MaintenanceStatus.OVERDUE, label: 'Vencido' },
      { value: MaintenanceStatus.CANCELLED, label: 'Cancelado' }
    ];

    // Class options
    this.classOptions = [
      { value: MaintenanceClass.PREVENTIVE, label: 'Preventivo' },
      { value: MaintenanceClass.CORRECTIVE, label: 'Correctivo' }
    ];
  }

  private loadSelectOptions(): void {
    // Load vehicles
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

    // Load maintenance types
    this.maintenanceService.getMaintenanceTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.maintenanceTypes = types;
          this.maintenanceTypeOptions = types.map(t => ({
            value: t.id,
            label: t.name,
            searchableText: `${t.name} ${t.category}`,
            data: { category: t.category }
          }));
        },
        error: (err) => console.error('Error loading maintenance types:', err)
      });
  }

  loadMaintenanceRecords(): void {
    this.loading = true;
    this.error = null;

    // Build filters with sorting
    const filtersWithSort = {
      ...this.filters,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.maintenanceService.getMaintenanceRecords(filtersWithSort).subscribe({
      next: (records) => {
        this.maintenanceRecords = records;
        this.total = records.length;
        this.totalPages = Math.ceil(this.total / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los registros de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadMaintenanceRecords();
  }

  onSortChange(): void {
    this.loadMaintenanceRecords();
  }

  clearFilters(): void {
    this.filters = {};
    this.page = 1;
    this.showAdvancedFilters = false;
    this.loadMaintenanceRecords();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  deleteMaintenanceRecord(record: MaintenanceRecord): void {
    if (record.status === MaintenanceStatus.COMPLETED) {
      alert('No se pueden eliminar mantenimientos completados');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el registro de mantenimiento del vehículo ${record.vehicle.licensePlate}?`)) {
      this.maintenanceService.deleteMaintenanceRecord(record.id).subscribe({
        next: () => {
          this.loadMaintenanceRecords();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar el registro de mantenimiento');
        }
      });
    }
  }

  get paginatedRecords(): MaintenanceRecord[] {
    const startIndex = (this.page - 1) * this.limit;
    return this.maintenanceRecords.slice(startIndex, startIndex + this.limit);
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

  // Status change logic
  canChangeStatus(record: MaintenanceRecord): boolean {
    return record.status === MaintenanceStatus.SCHEDULED;
  }

  getStatusChangeLabel(record: MaintenanceRecord): string {
    if (record.status === MaintenanceStatus.SCHEDULED) {
      return 'Marcar como completado';
    }
    return 'Sin acciones disponibles';
  }

  changeStatus(record: MaintenanceRecord): void {
    if (!this.canChangeStatus(record)) {
      return;
    }

    // Abrir modal usando ModalService
    const modalRef = this.modalService.open(MaintenanceChangeStatusModalComponent, {
      title: 'Cambiar Estado de Mantenimiento',
      data: {
        maintenanceId: record.id,
        currentStatus: record.status,
        targetStatus: MaintenanceStatus.COMPLETED
      }
    });

    // El modal maneja la llamada a la API internamente
    // Solo recargamos la lista cuando el modal cierra exitosamente
    modalRef.result
      .then(() => {
        // Modal cerrado exitosamente - el mantenimiento fue actualizado
        this.loadMaintenanceRecords();
      })
      .catch(() => {
        // Modal cancelado - no hacer nada
      });
  }

  getStatusBadgeClass(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return 'bg-yellow-100 text-yellow-800';
      case MaintenanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MaintenanceStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      case MaintenanceStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return 'Programado';
      case MaintenanceStatus.COMPLETED:
        return 'Completado';
      case MaintenanceStatus.OVERDUE:
        return 'Vencido';
      case MaintenanceStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  }

  getClassBadgeClass(maintenanceClass: MaintenanceClass): string {
    return maintenanceClass === MaintenanceClass.PREVENTIVE
      ? 'bg-blue-100 text-blue-800'
      : 'bg-orange-100 text-orange-800';
  }

  getClassLabel(maintenanceClass: MaintenanceClass): string {
    return maintenanceClass === MaintenanceClass.PREVENTIVE ? 'Preventivo' : 'Correctivo';
  }
}
