import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Trip, CreateTripDto } from '../../../../core/models/trip.model';
import { Customer } from '../../../../core/models/business/customer.model';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { Driver } from '../../../../core/models/business/driver.model';
import { Supplier } from '../../../../core/models/supplier.model';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ModalRef } from '../../../../core/services/modal.service';
import { TagsEditorComponent } from '../../../../shared/components/tags-editor/tags-editor.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TagsEditorComponent, CustomSelectComponent],
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
  private supplierService = inject(SupplierService);

  tripForm!: FormGroup;
  trip: Trip | null = null;

  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  subcontractors: Supplier[] = [];

  // Custom select options
  customerOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  driverOptions: CustomSelectOption[] = [];
  subcontractorOptions: CustomSelectOption[] = [];

  loading = false;
  tags: Record<string, any> = {};

  ngOnInit(): void {
    this.trip = this.data?.trip || null;
    this.tags = this.trip?.tags || {};
    this.loadCatalogs();
    this.initForm();
  }

  loadCatalogs(): void {
    this.loading = true;

    // Cargar clientes, vehículos, conductores y subcontratistas en paralelo
    Promise.all([
      this.customerService.getCustomers().toPromise(),
      this.vehicleService.getVehicles().toPromise(),
      this.driverService.getDrivers().toPromise(),
      this.supplierService.getSuppliers().toPromise()
    ]).then(([customers, vehicles, drivers, suppliers]) => {
      this.customers = customers || [];
      this.vehicles = vehicles || [];
      this.drivers = drivers || [];
      // Filtrar solo proveedores tipo SUBCONTRACTOR
      this.subcontractors = (suppliers || []).filter(s => s.supplierType === 'SUBCONTRACTOR');

      // Prepare custom select options
      this.prepareSelectOptions();

      this.loading = false;
    }).catch(err => {
      console.error('Error loading catalogs:', err);
      this.loading = false;
    });
  }

  prepareSelectOptions(): void {
    // Customer options with avatar
    this.customerOptions = this.customers.map(customer => ({
      value: customer.id,
      label: customer.businessName,
      data: {
        rut: customer.rut,
        email: customer.email,
        avatar: this.getInitials(customer.businessName),
        color: this.getColorFromName(customer.businessName)
      }
    }));

    // Vehicle options with details
    this.vehicleOptions = this.vehicles.map(vehicle => ({
      value: vehicle.id,
      label: `${vehicle.brand} ${vehicle.model}`,
      data: {
        plate: vehicle.licensePlate,
        year: vehicle.year,
        type: vehicle.type,
        status: vehicle.status
      }
    }));

    // Driver options with details
    this.driverOptions = this.drivers.map(driver => {
      const fullName = `${driver.firstName} ${driver.lastName}`;
      return {
        value: driver.id,
        label: fullName,
        data: {
          rut: driver.rut,
          licenseNumber: driver.licenseNumber,
          avatar: this.getInitials(fullName),
          color: this.getColorFromName(fullName)
        }
      };
    });

    // Subcontractor options with avatar
    this.subcontractorOptions = this.subcontractors.map(subcontractor => ({
      value: subcontractor.id,
      label: subcontractor.businessName,
      data: {
        rut: subcontractor.rut,
        contactName: subcontractor.contactName,
        avatar: this.getInitials(subcontractor.businessName),
        color: this.getColorFromName(subcontractor.businessName)
      }
    }));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getColorFromName(name: string): string {
    // Same color generation logic as app-avatar component
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#06B6D4', // cyan-500
      '#F97316', // orange-500
    ];

    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  initForm(): void {
    const now = new Date();
    const departureDate = this.trip?.departureDate
      ? new Date(this.trip.departureDate).toISOString().slice(0, 16)
      : now.toISOString().slice(0, 16);

    const arrivalDate = this.trip?.arrivalDate
      ? new Date(this.trip.arrivalDate).toISOString().slice(0, 16)
      : '';

    this.tripForm = this.fb.group({
      customerId: [this.trip?.customer?.id || '', [Validators.required]],
      isSubcontracted: [this.trip?.isSubcontracted || false],
      vehicleId: [this.trip?.vehicle?.id || ''],
      driverId: [this.trip?.driver?.id || ''],
      subcontractorId: [this.trip?.subcontractor?.id || ''],
      subcontractorCost: [this.trip?.subcontractorCost || ''],
      origin: [this.trip?.origin || '', [Validators.required, Validators.maxLength(200)]],
      destination: [this.trip?.destination || '', [Validators.required, Validators.maxLength(200)]],
      startKm: [this.trip?.startKm || '', [Validators.min(0)]],
      agreedPrice: [this.trip?.agreedPrice || '', [Validators.required, Validators.min(0)]],
      departureDate: [departureDate, [Validators.required]],
      arrivalDate: [arrivalDate],
      notes: [this.trip?.notes || '', [Validators.maxLength(500)]]
    });

    // Setup dynamic validation based on isSubcontracted
    this.setupDynamicValidation();
  }

  setupDynamicValidation(): void {
    const isSubcontractedControl = this.tripForm.get('isSubcontracted');

    // Listen to changes in isSubcontracted
    isSubcontractedControl?.valueChanges.subscribe(isSubcontracted => {
      const vehicleControl = this.tripForm.get('vehicleId');
      const driverControl = this.tripForm.get('driverId');
      const subcontractorControl = this.tripForm.get('subcontractorId');
      const subcontractorCostControl = this.tripForm.get('subcontractorCost');

      if (isSubcontracted) {
        // Subcontracted: require subcontractor fields
        vehicleControl?.clearValidators();
        driverControl?.clearValidators();
        subcontractorControl?.setValidators([Validators.required]);
        subcontractorCostControl?.setValidators([Validators.required, Validators.min(0)]);

        // Clear values
        vehicleControl?.setValue('');
        driverControl?.setValue('');
      } else {
        // Own trip: require vehicle and driver
        vehicleControl?.setValidators([Validators.required]);
        driverControl?.setValidators([Validators.required]);
        subcontractorControl?.clearValidators();
        subcontractorCostControl?.clearValidators();

        // Clear values
        subcontractorControl?.setValue('');
        subcontractorCostControl?.setValue('');
      }

      // Update validation
      vehicleControl?.updateValueAndValidity();
      driverControl?.updateValueAndValidity();
      subcontractorControl?.updateValueAndValidity();
      subcontractorCostControl?.updateValueAndValidity();
    });

    // Trigger initial validation
    isSubcontractedControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.tripForm.valid) {
      const formValue = this.tripForm.value;
      const isSubcontracted = formValue.isSubcontracted || false;

      // Convertir la fecha de string a Date
      const tripData: any = {
        customerId: formValue.customerId,
        isSubcontracted,
        origin: formValue.origin,
        destination: formValue.destination,
        departureDate: new Date(formValue.departureDate),
        agreedPrice: Number(formValue.agreedPrice),
        startKm: formValue.startKm ? Number(formValue.startKm) : undefined,
        notes: formValue.notes ?? undefined,
        tags: Object.keys(this.tags).length > 0 ? this.tags : undefined
      };

      // Add conditional fields based on trip type
      if (isSubcontracted) {
        tripData.subcontractorId = formValue.subcontractorId;
        tripData.subcontractorCost = Number(formValue.subcontractorCost);
      } else {
        tripData.vehicleId = formValue.vehicleId;
        tripData.driverId = formValue.driverId;
      }

      // Si se ingresó fecha de llegada, marcarla como manual
      if (formValue.arrivalDate) {
        tripData.arrivalDate = new Date(formValue.arrivalDate);
        tripData.isArrivalManual = true;
      }

      this.modalRef.close(tripData);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.tripForm.controls).forEach(key => {
        this.tripForm.get(key)?.markAsTouched();
      });
    }
  }

  // Helper to calculate commission in real-time
  calculateCommission(): number {
    const agreedPrice = Number(this.tripForm.get('agreedPrice')?.value) || 0;
    const subcontractorCost = Number(this.tripForm.get('subcontractorCost')?.value) || 0;
    return agreedPrice - subcontractorCost;
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  onTagsChange(tags: Record<string, any>): void {
    this.tags = tags;
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
