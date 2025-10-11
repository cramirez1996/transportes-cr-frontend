import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Trip, CreateTripDto } from '../../../../core/models/trip.model';
import { Customer } from '../../../../core/models/business/customer.model';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { Driver } from '../../../../core/models/business/driver.model';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { ModalRef } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-form.component.html',
  styleUrl: './trip-form.component.scss'
})
export class TripFormComponent implements OnInit {
  @Input() data?: { trip?: Trip };
  modalRef!: ModalRef<CreateTripDto>;

  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);

  tripForm!: FormGroup;
  trip: Trip | null = null;

  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];

  loading = false;

  ngOnInit(): void {
    this.trip = this.data?.trip || null;
    this.loadCatalogs();
    this.initForm();
  }

  loadCatalogs(): void {
    this.loading = true;

    // Cargar clientes, vehículos y conductores en paralelo
    Promise.all([
      this.customerService.getCustomers().toPromise(),
      this.vehicleService.getVehicles().toPromise(),
      this.driverService.getDrivers().toPromise()
    ]).then(([customers, vehicles, drivers]) => {
      this.customers = customers || [];
      this.vehicles = vehicles || [];
      this.drivers = drivers || [];
      this.loading = false;
    }).catch(err => {
      console.error('Error loading catalogs:', err);
      this.loading = false;
    });
  }

  initForm(): void {
    const now = new Date();
    const departureDate = this.trip?.departureDate
      ? new Date(this.trip.departureDate).toISOString().slice(0, 16)
      : now.toISOString().slice(0, 16);

    this.tripForm = this.fb.group({
      customerId: [this.trip?.customer?.id || '', [Validators.required]],
      vehicleId: [this.trip?.vehicle?.id || '', [Validators.required]],
      driverId: [this.trip?.driver?.id || '', [Validators.required]],
      origin: [this.trip?.origin || '', [Validators.required, Validators.maxLength(200)]],
      destination: [this.trip?.destination || '', [Validators.required, Validators.maxLength(200)]],
      startKm: [this.trip?.startKm || '', [Validators.min(0)]],
      agreedPrice: [this.trip?.agreedPrice || '', [Validators.required, Validators.min(0)]],
      departureDate: [departureDate, [Validators.required]],
      notes: [this.trip?.notes || '', [Validators.maxLength(500)]]
    });
  }

  onSubmit(): void {
    if (this.tripForm.valid) {
      const formValue = this.tripForm.value;

      // Convertir la fecha de string a Date
      const tripData: CreateTripDto = {
        customerId: formValue.customerId,
        vehicleId: formValue.vehicleId,
        driverId: formValue.driverId,
        origin: formValue.origin,
        destination: formValue.destination,
        departureDate: new Date(formValue.departureDate),
        agreedPrice: Number(formValue.agreedPrice),
        startKm: formValue.startKm ? Number(formValue.startKm) : undefined,
        notes: formValue.notes || undefined
      };

      this.modalRef.close(tripData);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.tripForm.controls).forEach(key => {
        this.tripForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  // Helpers para mostrar errores
  hasError(field: string, error: string): boolean {
    const control = this.tripForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.tripForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

}
