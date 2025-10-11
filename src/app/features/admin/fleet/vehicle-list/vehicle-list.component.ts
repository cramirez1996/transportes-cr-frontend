import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { ModalService } from '../../../../core/services/modal.service';
import { VehicleFormComponent } from '../vehicle-form/vehicle-form.component';

@Component({
  selector: 'app-vehicle-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss'
})
export class VehicleListComponent implements OnInit {
  vehicles = signal<Vehicle[]>([]);
  loading = signal(false);

  private vehicleService = inject(VehicleService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading.set(true);
    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading vehicles:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(VehicleFormComponent, {
      title: 'Nuevo Vehículo'
    });

    modalRef.result
      .then((vehicleData) => {
        this.vehicleService.createVehicle(vehicleData).subscribe({
          next: () => this.loadVehicles(),
          error: (err) => console.error('Error creating vehicle:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(vehicle: Vehicle): void {
    const modalRef = this.modalService.open(VehicleFormComponent, {
      title: 'Editar Vehículo',
      data: { vehicle }
    });

    modalRef.result
      .then((vehicleData) => {
        this.vehicleService.updateVehicle(vehicle.id, vehicleData).subscribe({
          next: () => this.loadVehicles(),
          error: (err) => console.error('Error updating vehicle:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  deleteVehicle(id: string): void {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => {
          this.loadVehicles();
        },
        error: (err) => console.error('Error deleting vehicle:', err)
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'available': 'bg-green-100 text-green-800',
      'in_use': 'bg-blue-100 text-blue-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'inactive': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'available': 'Disponible',
      'in_use': 'En uso',
      'maintenance': 'Mantenimiento',
      'inactive': 'Inactivo'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'truck': 'Camión',
      'van': 'Furgón',
      'pickup': 'Camioneta'
    };
    return labels[type] || type;
  }
}
