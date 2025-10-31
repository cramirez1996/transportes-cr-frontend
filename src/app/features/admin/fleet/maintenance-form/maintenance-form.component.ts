import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceClass, MaintenanceType } from '../../../../core/models/maintenance.model';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-maintenance-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './maintenance-form.component.html',
  styleUrl: './maintenance-form.component.scss'
})
export class MaintenanceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private maintenanceService = inject(MaintenanceService);
  private vehicleService = inject(VehicleService);

  maintenanceForm!: FormGroup;
  isEditMode = false;
  maintenanceId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  MaintenanceStatus = MaintenanceStatus;
  MaintenanceClass = MaintenanceClass;

  // Listas de datos
  vehicles: Vehicle[] = [];
  maintenanceTypes: MaintenanceType[] = [];

  // Custom select options
  vehicleOptions: CustomSelectOption[] = [];
  maintenanceTypeOptions: CustomSelectOption[] = [];
  classOptions: CustomSelectOption[] = [];
  statusOptions: CustomSelectOption[] = [];

  ngOnInit(): void {
    this.initForm();
    this.initializeSelectOptions();
    this.loadVehicles();
    this.loadMaintenanceTypes();

    this.maintenanceId = this.route.snapshot.paramMap.get('id');
    if (this.maintenanceId) {
      this.isEditMode = true;
      this.loadMaintenanceRecord(this.maintenanceId);
    }
  }

  initializeSelectOptions(): void {
    // Status options
    this.statusOptions = [
      { value: MaintenanceStatus.SCHEDULED, label: 'Programado' },
      { value: MaintenanceStatus.COMPLETED, label: 'Completado' },
      { value: MaintenanceStatus.OVERDUE, label: 'Vencido' },
      { value: MaintenanceStatus.CANCELLED, label: 'Cancelado' }
    ];

    // Class options
    this.classOptions = [
      { value: MaintenanceClass.PREVENTIVE, label: 'Preventivo' },
      { value: MaintenanceClass.CORRECTIVE, label: 'Correctivo' }
    ];
  }

  initForm(): void {
    this.maintenanceForm = this.fb.group({
      vehicleId: ['', Validators.required],
      maintenanceTypeId: ['', Validators.required],
      maintenanceClass: [MaintenanceClass.PREVENTIVE, Validators.required],
      scheduledDate: [''],
      executedDate: ['', Validators.required],
      vehicleKmAtMaintenance: [0, [Validators.required, Validators.min(0)]],
      nextMaintenanceKm: [0, Validators.min(0)],
      nextMaintenanceDate: [''],
      status: [MaintenanceStatus.SCHEDULED, Validators.required],
      cost: [0, Validators.min(0)],
      performedBy: [''],
      description: [''],
      notes: [''],
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
    this.maintenanceService.getMaintenanceTypes().subscribe({
      next: (types) => {
        this.maintenanceTypes = types.filter(t => t.isActive);
        this.maintenanceTypeOptions = this.maintenanceTypes.map(t => ({
          value: t.id,
          label: t.name,
          searchableText: `${t.name} ${t.category}`,
          data: { category: t.category, class: t.maintenanceClass }
        }));
      },
      error: (err) => {
        console.error('Error loading maintenance types:', err);
      }
    });
  }

  loadMaintenanceRecord(id: string): void {
    this.loading = true;
    this.maintenanceService.getMaintenanceRecordById(id).subscribe({
      next: (record) => {
        this.populateForm(record);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el registro de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  populateForm(record: MaintenanceRecord): void {
    this.maintenanceForm.patchValue({
      vehicleId: record.vehicle.id,
      maintenanceTypeId: record.maintenanceType.id,
      maintenanceClass: record.maintenanceClass,
      scheduledDate: record.scheduledDate ? this.formatDateForInput(record.scheduledDate) : '',
      executedDate: this.formatDateForInput(record.executedDate),
      vehicleKmAtMaintenance: record.vehicleKmAtMaintenance,
      nextMaintenanceKm: record.nextMaintenanceKm || 0,
      nextMaintenanceDate: record.nextMaintenanceDate ? this.formatDateForInput(record.nextMaintenanceDate) : '',
      status: record.status,
      cost: record.cost || 0,
      performedBy: record.performedBy || '',
      description: record.description || '',
      notes: record.notes || '',
    });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.maintenanceForm.value;
    const payload = {
      ...formValue,
      cost: formValue.cost || undefined,
      nextMaintenanceKm: formValue.nextMaintenanceKm || undefined,
      nextMaintenanceDate: formValue.nextMaintenanceDate || undefined,
      scheduledDate: formValue.scheduledDate || undefined,
    };

    const operation = this.isEditMode
      ? this.maintenanceService.updateMaintenanceRecord(this.maintenanceId!, payload)
      : this.maintenanceService.createMaintenanceRecord(payload);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/admin/fleet/maintenance']);
      },
      error: (err) => {
        this.error = 'Error al guardar el registro de mantenimiento';
        console.error(err);
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/fleet/maintenance']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.maintenanceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStatusOptions(): { value: MaintenanceStatus; label: string }[] {
    return [
      { value: MaintenanceStatus.SCHEDULED, label: 'Programado' },
      { value: MaintenanceStatus.COMPLETED, label: 'Completado' },
      { value: MaintenanceStatus.OVERDUE, label: 'Vencido' },
      { value: MaintenanceStatus.CANCELLED, label: 'Cancelado' },
    ];
  }

  getClassOptions(): { value: MaintenanceClass; label: string }[] {
    return [
      { value: MaintenanceClass.PREVENTIVE, label: 'Preventivo' },
      { value: MaintenanceClass.CORRECTIVE, label: 'Correctivo' },
    ];
  }
}
