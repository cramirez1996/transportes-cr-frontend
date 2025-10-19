import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vehicle, CreateVehicleDto } from '../../../../core/models/business/vehicle.model';
import { ModalRef } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-vehicle-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent implements OnInit {
  @Input() data?: { vehicle?: Vehicle };
  modalRef!: ModalRef<CreateVehicleDto>;

  private fb = inject(FormBuilder);
  vehicleForm!: FormGroup;
  vehicle: Vehicle | null = null;

  ngOnInit(): void {
    this.vehicle = this.data?.vehicle || null;

    this.vehicleForm = this.fb.group({
      licensePlate: [this.vehicle?.licensePlate || '', [Validators.required, Validators.pattern(/^[A-Z]{2,4}-?\d{2,4}$/i)]],
      brand: [this.vehicle?.brand || '', Validators.required],
      model: [this.vehicle?.model || '', Validators.required],
      year: [this.vehicle?.year || new Date().getFullYear(), [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear() + 1)]],
      type: [this.vehicle?.type || 'truck', Validators.required],
      capacity: [this.vehicle?.capacity || 0, [Validators.required, Validators.min(0.1)]],
      status: [this.vehicle?.status || 'available', Validators.required],
      mileage: [this.vehicle?.mileage || 0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.vehicleForm.valid) {
      this.modalRef.close(this.vehicleForm.value);
    }
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  getErrorMessage(field: string): string {
    const control = this.vehicleForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['pattern']) {
      return 'Formato de patente inválido (ej: AB1234, ABCD12, AB-1234, ABCD-12)';
    }
    if (control.errors['min']) {
      return `Valor mínimo: ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `Valor máximo: ${control.errors['max'].max}`;
    }
    return '';
  }
}
