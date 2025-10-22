import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Trip, TripStatus } from '../../../../core/models/trip.model';
import { TripService } from '../../../../core/services/trip.service';
import { ModalService } from '../../../../core/services/modal.service';
import { TripFormComponent } from '../trip-form/trip-form.component';
import { NgpMenu, NgpMenuTrigger, NgpMenuItem } from 'ng-primitives/menu';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgpMenu, NgpMenuTrigger, NgpMenuItem],
  templateUrl: './trip-list.component.html',
  styleUrl: './trip-list.component.scss'
})
export class TripListComponent implements OnInit {
  private tripService = inject(TripService);
  private modalService = inject(ModalService);

  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  selectedStatus: TripStatus | 'all' = 'all';
  loading = false;

  // Para los badges de estado
  statusLabels = {
    [TripStatus.PENDING]: 'Pendiente',
    [TripStatus.IN_PROGRESS]: 'En Curso',
    [TripStatus.COMPLETED]: 'Completado',
    [TripStatus.CANCELLED]: 'Cancelado'
  };

  statusColors = {
    [TripStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TripStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TripStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };

  // Expose TripStatus enum to template
  TripStatus = TripStatus;

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.loading = true;
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        this.trips = trips;
        this.filterTrips();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar viajes:', err);
        alert('Error al cargar los viajes. Por favor, intente nuevamente.');
        this.loading = false;
      }
    });
  }

  filterTrips(): void {
    if (this.selectedStatus === 'all') {
      this.filteredTrips = [...this.trips];
    } else {
      this.filteredTrips = this.trips.filter(t => t.status === this.selectedStatus);
    }
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value as TripStatus | 'all';
    this.filterTrips();
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(TripFormComponent, {
      title: 'Nuevo Viaje'
    });

    modalRef.result
      .then((tripData) => {
        this.tripService.createTrip(tripData).subscribe({
          next: () => {
            alert('Viaje creado exitosamente');
            this.loadTrips();
          },
          error: (err) => {
            console.error('Error al crear viaje:', err);
            alert('Error al crear el viaje. Por favor, verifique los datos e intente nuevamente.');
          }
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(trip: Trip): void {
    const modalRef = this.modalService.open(TripFormComponent, {
      title: 'Editar Viaje',
      data: { trip }
    });

    modalRef.result
      .then((tripData) => {
        this.tripService.updateTrip(trip.id, tripData).subscribe({
          next: () => {
            alert('Viaje actualizado exitosamente');
            this.loadTrips();
          },
          error: (err) => {
            console.error('Error al actualizar viaje:', err);
            alert('Error al actualizar el viaje. Por favor, intente nuevamente.');
          }
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  startTrip(trip: Trip): void {
    if (confirm(`¿Iniciar el viaje a ${trip.destination}?`)) {
      this.tripService.startTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje iniciado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al iniciar viaje:', err);
          alert('Error al iniciar el viaje. Solo los viajes pendientes pueden ser iniciados.');
        }
      });
    }
  }

  completeTrip(trip: Trip): void {
    if (confirm(`¿Marcar como completado el viaje a ${trip.destination}?`)) {
      this.tripService.completeTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje completado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al completar viaje:', err);
          alert('Error al completar el viaje. Solo los viajes en curso pueden ser completados.');
        }
      });
    }
  }

  cancelTrip(trip: Trip): void {
    const notes = prompt('Motivo de cancelación (opcional):');
    if (notes !== null) {
      this.tripService.cancelTrip(trip.id, notes).subscribe({
        next: () => {
          alert('Viaje cancelado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al cancelar viaje:', err);
          alert('Error al cancelar el viaje. Por favor, intente nuevamente.');
        }
      });
    }
  }

  deleteTrip(trip: Trip): void {
    if (confirm(`¿Está seguro de eliminar el viaje a ${trip.destination}?`)) {
      this.tripService.deleteTrip(trip.id).subscribe({
        next: () => {
          alert('Viaje eliminado exitosamente');
          this.loadTrips();
        },
        error: (err) => {
          console.error('Error al eliminar viaje:', err);
          alert('Error al eliminar el viaje. Solo los viajes pendientes o cancelados pueden ser eliminados.');
        }
      });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  canStart(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING;
  }

  canComplete(trip: Trip): boolean {
    return trip.status === TripStatus.IN_PROGRESS;
  }

  canCancel(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING || trip.status === TripStatus.IN_PROGRESS;
  }

  canEdit(trip: Trip): boolean {
    // Permitir editar viajes en cualquier estado
    return true;
  }

  canDelete(trip: Trip): boolean {
    return trip.status === TripStatus.PENDING || trip.status === TripStatus.CANCELLED;
  }

  // Métodos para contar trips por estado (para el template)
  getPendingCount(): number {
    return this.trips.filter(t => t.status === TripStatus.PENDING).length;
  }

  getInProgressCount(): number {
    return this.trips.filter(t => t.status === TripStatus.IN_PROGRESS).length;
  }

  getCompletedCount(): number {
    return this.trips.filter(t => t.status === TripStatus.COMPLETED).length;
  }

  getCancelledCount(): number {
    return this.trips.filter(t => t.status === TripStatus.CANCELLED).length;
  }
}
