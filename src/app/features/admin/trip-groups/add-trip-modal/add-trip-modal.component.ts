import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalRef } from '../../../../core/services/modal.service';
import { TripService } from '../../../../core/services/trip.service';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-trip-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './add-trip-modal.component.html',
  styleUrl: './add-trip-modal.component.scss'
})
export class AddTripModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tripService = inject(TripService);

  // Injected by ModalService
  modalRef!: ModalRef;
  data!: { tripGroupId: string; tripGroupCode: string };

  form!: FormGroup;
  loading = false;
  loadingTrips = true;
  error: string | null = null;

  tripOptions: CustomSelectOption[] = [];
  selectedTrip: any = null;

  ngOnInit(): void {
    this.initForm();
    this.loadAvailableTrips();
  }

  initForm(): void {
    this.form = this.fb.group({
      tripId: [null, Validators.required]
    });

    // Watch for trip selection changes
    this.form.get('tripId')?.valueChanges.subscribe(tripId => {
      this.onTripSelected(tripId);
    });
  }

  loadAvailableTrips(): void {
    this.loadingTrips = true;
    this.error = null;

    // Load trips without a trip group assigned
    this.tripService.getTrips({
      page: 1,
      limit: 1000
    }, {
      sortBy: 'departureDate',
      sortOrder: 'DESC'
    }).subscribe({
      next: (response) => {
        // Filter trips that don't have a tripGroupId
        const availableTrips = response.data.filter(trip => !trip.tripGroupId);

        this.tripOptions = availableTrips.map(trip => ({
          value: trip.id,
          label: `${trip.origin} → ${trip.destination}`,
          data: {
            trip: trip,
            customer: trip.customer?.businessName || trip.customer?.contactName || 'Sin cliente',
            departureDate: trip.departureDate,
            agreedPrice: trip.agreedPrice,
            vehicle: (trip.vehicle as any)?.plateNumber || (trip.vehicle as any)?.licensePlate || 'Sin vehículo',
            driver: (trip.driver as any)?.name || (trip.driver as any)?.firstName || 'Sin conductor',
            isSubcontracted: trip.isSubcontracted,
            subcontractor: trip.subcontractor?.businessName || null
          }
        }));

        this.loadingTrips = false;
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.error = 'Error al cargar los viajes disponibles';
        this.loadingTrips = false;
      }
    });
  }

  onTripSelected(tripId: string): void {
    if (!tripId) {
      this.selectedTrip = null;
      return;
    }

    const option = this.tripOptions.find(opt => opt.value === tripId);
    if (option) {
      this.selectedTrip = option.data.trip;
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tripId = this.form.value.tripId;

    this.loading = true;
    this.error = null;

    // Update the trip to assign it to the trip group
    this.tripService.updateTrip(tripId, { tripGroupId: this.data.tripGroupId }).subscribe({
      next: (updatedTrip) => {
        // Success - close modal and return the updated trip
        this.modalRef.close(updatedTrip);
      },
      error: (error) => {
        console.error('Error adding trip to group:', error);
        this.error = 'Error al agregar el viaje a la vuelta';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.modalRef.dismiss();
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

  getCustomerName(customer: any): string {
    if (!customer) return 'Sin cliente';
    return customer.businessName || customer.contactName || 'Sin cliente';
  }

  getVehiclePlate(vehicle: any): string {
    if (!vehicle) return 'Sin vehículo';
    return vehicle.plateNumber || vehicle.licensePlate || vehicle.plate || 'Sin vehículo';
  }

  getDriverName(driver: any): string {
    if (!driver) return 'Sin conductor';
    return driver.name || driver.fullName || driver.firstName || 'Sin conductor';
  }
}
