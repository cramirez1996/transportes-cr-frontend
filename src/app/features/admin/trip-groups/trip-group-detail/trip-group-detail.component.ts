import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TripGroup, TRIP_GROUP_STATUS_LABELS, TRIP_GROUP_STATUS_COLORS } from '../../../../core/models/trip-group.model';
import { TripGroupService } from '../../../../core/services/trip-group.service';
import { TripService } from '../../../../core/services/trip.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { PaymentMethod } from '../../../../core/models/transaction.model';
import { TripStatus } from '../../../../core/models/trip.model';
import { ModalService } from '../../../../core/services/modal.service';
import { AddTripModalComponent } from '../add-trip-modal/add-trip-modal.component';
import { AddExpenseModalComponent } from '../add-expense-modal/add-expense-modal.component';
import { RemoveExpenseModalComponent } from '../remove-expense-modal/remove-expense-modal.component';

@Component({
  selector: 'app-trip-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trip-group-detail.component.html',
  styleUrl: './trip-group-detail.component.scss'
})
export class TripGroupDetailComponent implements OnInit {
  private modalService = inject(ModalService);
  private tripService = inject(TripService);
  private transactionService = inject(TransactionService);

  tripGroup: TripGroup | null = null;
  isLoading = true;
  statusLabels = TRIP_GROUP_STATUS_LABELS;
  statusColors = TRIP_GROUP_STATUS_COLORS;

  constructor(
    private route: ActivatedRoute,
    private tripGroupService: TripGroupService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTripGroup(id);
    }
  }

  loadTripGroup(id: string): void {
    this.isLoading = true;
    this.tripGroupService.getById(id).subscribe({
      next: (data) => {
        this.tripGroup = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading trip group:', error);
        this.isLoading = false;
      },
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.TRANSFER]: 'Transferencia',
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.CHECK]: 'Cheque',
    };
    return labels[method] || method;
  }

  openAddTripModal(): void {
    if (!this.tripGroup) return;

    const modalRef = this.modalService.open(AddTripModalComponent, {
      title: 'Agregar Viaje a la Vuelta',
      data: {
        tripGroupId: this.tripGroup.id,
        tripGroupCode: this.tripGroup.code
      }
    });

    modalRef.result
      .then(() => {
        // Trip added successfully - reload trip group data
        if (this.tripGroup) {
          this.loadTripGroup(this.tripGroup.id);
        }
      })
      .catch(() => {
        // Modal dismissed - no action needed
      });
  }

  removeTripFromGroup(trip: any): void {
    if (!this.tripGroup) return;

    if (confirm(`¿Está seguro que desea quitar el viaje "${trip.origin} → ${trip.destination}" de esta vuelta?`)) {
      this.tripService.updateTrip(trip.id, { tripGroupId: null }).subscribe({
        next: () => {
          // Trip removed successfully - reload trip group data
          if (this.tripGroup) {
            this.loadTripGroup(this.tripGroup.id);
          }
        },
        error: (error) => {
          console.error('Error removing trip from group:', error);
          alert('Error al quitar el viaje de la vuelta');
        }
      });
    }
  }

  getTripStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
  }

  getTripStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  openAddExpenseModal(): void {
    if (!this.tripGroup) return;

    const modalRef = this.modalService.open(AddExpenseModalComponent, {
      title: 'Agregar Gasto a la Vuelta',
      data: {
        tripGroupId: this.tripGroup.id,
        tripGroupCode: this.tripGroup.code
      }
    });

    modalRef.result
      .then(() => {
        // Expense added successfully - reload trip group data
        if (this.tripGroup) {
          this.loadTripGroup(this.tripGroup.id);
        }
      })
      .catch(() => {
        // Modal dismissed - no action needed
      });
  }

  removeExpenseFromGroup(expense: any): void {
    if (!this.tripGroup) return;

    const modalRef = this.modalService.open(RemoveExpenseModalComponent, {
      title: 'Quitar Gasto',
      data: {
        expenseId: expense.id,
        expenseDescription: expense.description
      }
    });

    modalRef.result
      .then((result: { deleted: boolean }) => {
        // Expense removed or deleted successfully - reload trip group data
        if (this.tripGroup) {
          this.loadTripGroup(this.tripGroup.id);
        }
      })
      .catch(() => {
        // Modal dismissed - no action needed
      });
  }
}
