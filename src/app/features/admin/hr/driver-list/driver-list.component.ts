import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DriverService } from '../../../../core/services/business/driver.service';
import { Driver } from '../../../../core/models/business/driver.model';
import { ModalService } from '../../../../core/services/modal.service';
import { DriverFormComponent } from '../driver-form/driver-form.component';

@Component({
  selector: 'app-driver-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.scss'
})
export class DriverListComponent implements OnInit {
  drivers = signal<Driver[]>([]);
  loading = signal(false);

  private driverService = inject(DriverService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.loading.set(true);
    this.driverService.getDrivers().subscribe({
      next: (drivers) => {
        this.drivers.set(drivers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(DriverFormComponent, {
      title: 'Nuevo Conductor'
    });

    modalRef.result
      .then((driverData) => {
        this.driverService.createDriver(driverData).subscribe({
          next: () => this.loadDrivers(),
          error: (err) => console.error('Error creating driver:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(driver: Driver): void {
    const modalRef = this.modalService.open(DriverFormComponent, {
      title: 'Editar Conductor',
      data: { driver }
    });

    modalRef.result
      .then((driverData) => {
        this.driverService.updateDriver(driver.id, driverData).subscribe({
          next: () => this.loadDrivers(),
          error: (err) => console.error('Error updating driver:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  deleteDriver(id: string): void {
    if (confirm('¿Estás seguro de eliminar este conductor?')) {
      this.driverService.deleteDriver(id).subscribe({
        next: () => this.loadDrivers(),
        error: (err) => console.error('Error deleting driver:', err)
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'on_leave': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'on_leave': 'De licencia'
    };
    return labels[status] || status;
  }
}
