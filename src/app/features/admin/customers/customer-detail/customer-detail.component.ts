import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { TripService } from '../../../../core/services/trip.service';
import { Customer, CustomerStatus } from '../../../../core/models/business/customer.model';
import { Trip, TripStatus } from '../../../../core/models/trip.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss'
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private tripService = inject(TripService);

  customer: Customer | null = null;
  trips: Trip[] = [];
  loading = false;
  loadingTrips = false;

  // Status configuration
  statusLabels = {
    [CustomerStatus.ACTIVE]: 'Activo',
    [CustomerStatus.INACTIVE]: 'Inactivo'
  };

  statusColors = {
    [CustomerStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [CustomerStatus.INACTIVE]: 'bg-red-100 text-red-800'
  };

  tripStatusLabels = {
    [TripStatus.PENDING]: 'Pendiente',
    [TripStatus.IN_PROGRESS]: 'En Curso',
    [TripStatus.COMPLETED]: 'Completado',
    [TripStatus.CANCELLED]: 'Cancelado'
  };

  tripStatusColors = {
    [TripStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TripStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TripStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };

  ngOnInit(): void {
    this.loadCustomerDetail();
  }

  loadCustomerDetail(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (!customerId) {
      alert('ID de cliente no válido');
      this.router.navigate(['/admin/customers']);
      return;
    }

    this.loading = true;
    this.customerService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.loading = false;
        this.loadCustomerTrips(customerId);
      },
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        alert('Error al cargar el detalle del cliente');
        this.loading = false;
      }
    });
  }

  loadCustomerTrips(customerId: string): void {
    this.loadingTrips = true;
    this.tripService.getTripsByCustomer(customerId).subscribe({
      next: (trips) => {
        this.trips = trips;
        this.loadingTrips = false;
      },
      error: (err) => {
        console.error('Error al cargar viajes:', err);
        this.loadingTrips = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  calculateTotalRevenue(): number {
    return this.trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .reduce((sum, trip) => sum + parseFloat(trip.agreedPrice), 0);
  }

  calculateTotalProfit(): number {
    return this.trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .reduce((sum, trip) => sum + (trip.profit || 0), 0);
  }

  getCompletedTripsCount(): number {
    return this.trips.filter(trip => trip.status === TripStatus.COMPLETED).length;
  }
}
