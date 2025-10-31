import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { MaintenanceType, MaintenanceClass } from '../../../../core/models/maintenance.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-vehicle-maintenance-plans-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './vehicle-maintenance-plans-form.component.html',
  styleUrl: './vehicle-maintenance-plans-form.component.scss'
})
export class VehicleMaintenancePlansFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private maintenanceService = inject(MaintenanceService);
  private vehicleService = inject(VehicleService);

  planForm!: FormGroup;
  isEditMode = false;
  planId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  // Data lists
  vehicles: Vehicle[] = [];
  maintenanceTypes: MaintenanceType[] = [];
  selectedMaintenanceType: MaintenanceType | null = null;

  // Custom select options
  vehicleOptions: CustomSelectOption[] = [];
  maintenanceTypeOptions: CustomSelectOption[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadVehicles();
    this.loadMaintenanceTypes();
    this.setupFormSubscriptions();

    this.planId = this.route.snapshot.paramMap.get('id');
    if (this.planId) {
      this.isEditMode = true;
      this.loadPlan(this.planId);
    }
  }

  initForm(): void {
    this.planForm = this.fb.group({
      vehicleId: ['', Validators.required],
      maintenanceTypeId: ['', Validators.required],
      isEnabled: [true],
      customIntervalKm: [null, Validators.min(1)],
      customIntervalMonths: [null, Validators.min(1)],
      notes: ['']
    });
  }

  setupFormSubscriptions(): void {
    // Escuchar cambios en el tipo de mantenimiento seleccionado
    this.planForm.get('maintenanceTypeId')?.valueChanges.subscribe(typeId => {
      this.selectedMaintenanceType = this.maintenanceTypes.find(t => t.id === typeId) || null;
    });
  }

  loadVehicles(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.vehicleOptions = vehicles.map(v => ({
          value: v.id,
          label: v.licensePlate,
          searchableText: `${v.licensePlate} ${v.brand} ${v.model}`,
          data: { brand: v.brand, model: v.model, type: v.type }
        }));
      },
      error: (err) => {
        console.error('Error loading vehicles:', err);
      }
    });
  }

  loadMaintenanceTypes(): void {
    // Solo cargar tipos preventivos (los correctivos no se planifican)
    this.maintenanceService.getMaintenanceTypes({
      maintenanceClass: MaintenanceClass.PREVENTIVE,
      isActive: true
    }).subscribe({
      next: (types) => {
        this.maintenanceTypes = types;
        this.maintenanceTypeOptions = types.map(t => ({
          value: t.id,
          label: t.name,
          searchableText: `${t.name} ${t.description || ''} ${t.category}`,
          data: {
            category: t.category,
            intervalKilometers: t.intervalKilometers,
            intervalMonths: t.intervalMonths
          }
        }));
      },
      error: (err) => {
        console.error('Error loading maintenance types:', err);
      }
    });
  }

  loadPlan(id: string): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getVehicleMaintenanceById(id).subscribe({
      next: (plan) => {
        this.planForm.patchValue({
          vehicleId: plan.vehicle.id,
          maintenanceTypeId: plan.maintenanceType.id,
          isEnabled: plan.isEnabled,
          customIntervalKm: plan.customIntervalKm,
          customIntervalMonths: plan.customIntervalMonths,
          notes: plan.notes
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el plan de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.planForm.value;

    // Preparar datos
    const payload: any = {
      vehicleId: formValue.vehicleId,
      maintenanceTypeId: formValue.maintenanceTypeId,
      isEnabled: formValue.isEnabled,
      customIntervalKm: formValue.customIntervalKm || null,
      customIntervalMonths: formValue.customIntervalMonths || null,
      notes: formValue.notes || null
    };

    const request = this.isEditMode
      ? this.maintenanceService.updateVehicleMaintenance(this.planId!, payload)
      : this.maintenanceService.createVehicleMaintenance(payload);

    request.subscribe({
      next: () => {
        this.router.navigate(['/admin/fleet/vehicle-maintenance-plans']);
      },
      error: (err) => {
        if (err.error?.message?.includes('Ya existe')) {
          this.error = 'Ya existe un plan de mantenimiento para este vehículo y tipo. Edita el existente o elimínalo primero.';
        } else if (err.error?.message?.includes('preventivo')) {
          this.error = 'Solo se pueden crear planes para mantenimientos preventivos. Los correctivos se registran cuando ocurren.';
        } else {
          this.error = err.error?.message || 'Error al guardar el plan de mantenimiento';
        }
        console.error(err);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/fleet/vehicle-maintenance-plans']);
  }

  // Helper methods
  getDefaultIntervalKm(): number | null {
    return this.selectedMaintenanceType?.intervalKilometers || null;
  }

  getDefaultIntervalMonths(): number | null {
    return this.selectedMaintenanceType?.intervalMonths || null;
  }

  hasDefaultKmInterval(): boolean {
    return this.selectedMaintenanceType?.intervalKilometers !== null &&
           this.selectedMaintenanceType?.intervalKilometers !== undefined;
  }

  hasDefaultMonthsInterval(): boolean {
    return this.selectedMaintenanceType?.intervalMonths !== null &&
           this.selectedMaintenanceType?.intervalMonths !== undefined;
  }
}
