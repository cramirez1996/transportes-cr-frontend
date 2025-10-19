import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService, MaintenanceFilters } from '../../../../core/services/maintenance.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceClass } from '../../../../core/models/maintenance.model';

@Component({
  selector: 'app-maintenance-list',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);

  maintenanceRecords: MaintenanceRecord[] = [];
  filteredRecords: MaintenanceRecord[] = [];
  loading = false;
  error: string | null = null;
  Math = Math;

  // Filtros
  filters: MaintenanceFilters = {};
  MaintenanceStatus = MaintenanceStatus;
  MaintenanceClass = MaintenanceClass;

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  ngOnInit(): void {
    this.loadMaintenanceRecords();
  }

  loadMaintenanceRecords(): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getMaintenanceRecords(this.filters).subscribe({
      next: (records) => {
        this.maintenanceRecords = records;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los registros de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredRecords = this.maintenanceRecords;
    this.totalPages = Math.ceil(this.filteredRecords.length / this.pageSize);
  }

  onFilterChange(): void {
    this.loadMaintenanceRecords();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadMaintenanceRecords();
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
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getStatusBadgeClass(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.SCHEDULED:
        return 'badge-warning';
      case MaintenanceStatus.COMPLETED:
        return 'badge-success';
      case MaintenanceStatus.OVERDUE:
        return 'badge-danger';
      case MaintenanceStatus.CANCELLED:
        return 'badge-secondary';
      default:
        return 'badge-secondary';
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
    return maintenanceClass === MaintenanceClass.PREVENTIVE ? 'badge-info' : 'badge-warning';
  }

  getClassLabel(maintenanceClass: MaintenanceClass): string {
    return maintenanceClass === MaintenanceClass.PREVENTIVE ? 'Preventivo' : 'Correctivo';
  }
}
