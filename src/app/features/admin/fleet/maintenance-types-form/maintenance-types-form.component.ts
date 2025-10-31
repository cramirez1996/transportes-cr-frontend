import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { MaintenanceType, MaintenanceCategory, MaintenanceClass, IntervalType } from '../../../../core/models/maintenance.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-maintenance-types-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CustomSelectComponent],
  templateUrl: './maintenance-types-form.component.html',
  styleUrl: './maintenance-types-form.component.scss'
})
export class MaintenanceTypesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private maintenanceService = inject(MaintenanceService);

  maintenanceTypeForm!: FormGroup;
  isEditMode = false;
  typeId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  MaintenanceCategory = MaintenanceCategory;
  MaintenanceClass = MaintenanceClass;
  IntervalType = IntervalType;

  // Custom select options
  categoryOptions: CustomSelectOption[] = [];
  classOptions: CustomSelectOption[] = [];
  intervalTypeOptions: CustomSelectOption[] = [];

  ngOnInit(): void {
    this.initForm();
    this.initializeSelectOptions();
    this.setupFormSubscriptions();

    this.typeId = this.route.snapshot.paramMap.get('id');
    if (this.typeId) {
      this.isEditMode = true;
      this.loadMaintenanceType(this.typeId);
    }
  }

  initializeSelectOptions(): void {
    // Category options
    this.categoryOptions = [
      { value: MaintenanceCategory.ENGINE, label: 'Motor' },
      { value: MaintenanceCategory.TRANSMISSION, label: 'Transmisión' },
      { value: MaintenanceCategory.BRAKES, label: 'Frenos' },
      { value: MaintenanceCategory.SUSPENSION, label: 'Suspensión' },
      { value: MaintenanceCategory.TIRES, label: 'Neumáticos' },
      { value: MaintenanceCategory.ELECTRICAL, label: 'Eléctrico' },
      { value: MaintenanceCategory.COOLING, label: 'Refrigeración' },
      { value: MaintenanceCategory.FUEL, label: 'Combustible' },
      { value: MaintenanceCategory.EXHAUST, label: 'Escape' },
      { value: MaintenanceCategory.BODY, label: 'Carrocería' },
      { value: MaintenanceCategory.LEGAL, label: 'Legal' },
      { value: MaintenanceCategory.OTHER, label: 'Otro' }
    ];

    // Class options
    this.classOptions = [
      { value: MaintenanceClass.PREVENTIVE, label: 'Preventivo' },
      { value: MaintenanceClass.CORRECTIVE, label: 'Correctivo' }
    ];

    // Interval type options (solo para preventivo)
    this.intervalTypeOptions = [
      { value: IntervalType.KILOMETERS, label: 'Por kilómetros' },
      { value: IntervalType.MONTHS, label: 'Por meses' },
      { value: IntervalType.BOTH, label: 'Ambos (km y meses)' }
    ];
  }

  initForm(): void {
    this.maintenanceTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      category: [MaintenanceCategory.OTHER, Validators.required],
      maintenanceClass: [MaintenanceClass.PREVENTIVE, Validators.required],

      // Campos para mantenimiento preventivo
      intervalType: [IntervalType.KILOMETERS],
      intervalKilometers: [null, Validators.min(1)],
      intervalMonths: [null, Validators.min(1)],
      alertBeforeKm: [1000, [Validators.required, Validators.min(0)]],
      alertBeforeDays: [7, [Validators.required, Validators.min(0)]],

      isMandatory: [false],
      isActive: [true],
      estimatedCost: [null, Validators.min(0)],
      estimatedDurationHours: [null, Validators.min(0)]
    });
  }

  setupFormSubscriptions(): void {
    // Escuchar cambios en maintenanceClass
    this.maintenanceTypeForm.get('maintenanceClass')?.valueChanges.subscribe(value => {
      this.updateIntervalValidators(value);
    });

    // Escuchar cambios en intervalType
    this.maintenanceTypeForm.get('intervalType')?.valueChanges.subscribe(value => {
      this.updateIntervalFieldsRequirement(value);
    });
  }

  updateIntervalValidators(maintenanceClass: MaintenanceClass): void {
    const intervalTypeControl = this.maintenanceTypeForm.get('intervalType');
    const intervalKmControl = this.maintenanceTypeForm.get('intervalKilometers');
    const intervalMonthsControl = this.maintenanceTypeForm.get('intervalMonths');
    const alertBeforeKmControl = this.maintenanceTypeForm.get('alertBeforeKm');
    const alertBeforeDaysControl = this.maintenanceTypeForm.get('alertBeforeDays');

    if (maintenanceClass === MaintenanceClass.PREVENTIVE) {
      // Preventivo: requiere intervalType y al menos un intervalo
      intervalTypeControl?.setValidators([Validators.required]);
      intervalTypeControl?.enable();

      // Los intervalos específicos se manejan en updateIntervalFieldsRequirement
      this.updateIntervalFieldsRequirement(intervalTypeControl?.value);

      alertBeforeKmControl?.enable();
      alertBeforeDaysControl?.enable();
    } else {
      // Correctivo: no requiere intervalos
      intervalTypeControl?.clearValidators();
      intervalTypeControl?.disable();
      intervalKmControl?.clearValidators();
      intervalKmControl?.disable();
      intervalMonthsControl?.clearValidators();
      intervalMonthsControl?.disable();
      alertBeforeKmControl?.disable();
      alertBeforeDaysControl?.disable();
    }

    intervalTypeControl?.updateValueAndValidity();
    intervalKmControl?.updateValueAndValidity();
    intervalMonthsControl?.updateValueAndValidity();
    alertBeforeKmControl?.updateValueAndValidity();
    alertBeforeDaysControl?.updateValueAndValidity();
  }

  updateIntervalFieldsRequirement(intervalType: IntervalType): void {
    const intervalKmControl = this.maintenanceTypeForm.get('intervalKilometers');
    const intervalMonthsControl = this.maintenanceTypeForm.get('intervalMonths');
    const maintenanceClass = this.maintenanceTypeForm.get('maintenanceClass')?.value;

    if (maintenanceClass !== MaintenanceClass.PREVENTIVE) {
      return;
    }

    // Clear validators first
    intervalKmControl?.clearValidators();
    intervalMonthsControl?.clearValidators();

    switch (intervalType) {
      case IntervalType.KILOMETERS:
        intervalKmControl?.setValidators([Validators.required, Validators.min(1)]);
        intervalKmControl?.enable();
        intervalMonthsControl?.disable();
        intervalMonthsControl?.setValue(null);
        break;
      case IntervalType.MONTHS:
        intervalMonthsControl?.setValidators([Validators.required, Validators.min(1)]);
        intervalMonthsControl?.enable();
        intervalKmControl?.disable();
        intervalKmControl?.setValue(null);
        break;
      case IntervalType.BOTH:
        intervalKmControl?.setValidators([Validators.required, Validators.min(1)]);
        intervalMonthsControl?.setValidators([Validators.required, Validators.min(1)]);
        intervalKmControl?.enable();
        intervalMonthsControl?.enable();
        break;
    }

    intervalKmControl?.updateValueAndValidity();
    intervalMonthsControl?.updateValueAndValidity();
  }

  loadMaintenanceType(id: string): void {
    this.loading = true;
    this.error = null;

    this.maintenanceService.getMaintenanceTypeById(id).subscribe({
      next: (type) => {
        this.maintenanceTypeForm.patchValue({
          name: type.name,
          description: type.description,
          category: type.category,
          maintenanceClass: type.maintenanceClass,
          intervalType: type.intervalType,
          intervalKilometers: type.intervalKilometers,
          intervalMonths: type.intervalMonths,
          alertBeforeKm: type.alertBeforeKm,
          alertBeforeDays: type.alertBeforeDays,
          isMandatory: type.isMandatory,
          isActive: type.isActive,
          estimatedCost: type.estimatedCost,
          estimatedDurationHours: type.estimatedDurationHours
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el tipo de mantenimiento';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.maintenanceTypeForm.invalid) {
      this.maintenanceTypeForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.maintenanceTypeForm.value;

    // Preparar datos según la clase de mantenimiento
    const payload: any = {
      name: formValue.name,
      description: formValue.description || null,
      category: formValue.category,
      maintenanceClass: formValue.maintenanceClass,
      isMandatory: formValue.isMandatory,
      isActive: formValue.isActive,
      estimatedCost: formValue.estimatedCost || null,
      estimatedDurationHours: formValue.estimatedDurationHours || null
    };

    // Solo incluir campos de intervalo si es preventivo
    if (formValue.maintenanceClass === MaintenanceClass.PREVENTIVE) {
      payload.intervalType = formValue.intervalType;
      payload.intervalKilometers = formValue.intervalKilometers || null;
      payload.intervalMonths = formValue.intervalMonths || null;
      payload.alertBeforeKm = formValue.alertBeforeKm;
      payload.alertBeforeDays = formValue.alertBeforeDays;
    }

    const request = this.isEditMode
      ? this.maintenanceService.updateMaintenanceType(this.typeId!, payload)
      : this.maintenanceService.createMaintenanceType(payload);

    request.subscribe({
      next: () => {
        this.router.navigate(['/admin/fleet/maintenance-types']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar el tipo de mantenimiento';
        console.error(err);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/fleet/maintenance-types']);
  }

  get isPreventive(): boolean {
    return this.maintenanceTypeForm.get('maintenanceClass')?.value === MaintenanceClass.PREVENTIVE;
  }

  get showKilometersField(): boolean {
    if (!this.isPreventive) return false;
    const intervalType = this.maintenanceTypeForm.get('intervalType')?.value;
    return intervalType === IntervalType.KILOMETERS || intervalType === IntervalType.BOTH;
  }

  get showMonthsField(): boolean {
    if (!this.isPreventive) return false;
    const intervalType = this.maintenanceTypeForm.get('intervalType')?.value;
    return intervalType === IntervalType.MONTHS || intervalType === IntervalType.BOTH;
  }
}
