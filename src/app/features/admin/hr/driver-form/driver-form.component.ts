import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Driver, CreateDriverDto } from '../../../../core/models/business/driver.model';
import { ModalRef } from '../../../../core/services/modal.service';
import { rutValidator } from '../../../../shared/validators/rut.validator';
import { RutFormatDirective } from '../../../../shared/directives/rut-format.directive';

@Component({
  selector: 'app-driver-form',
  imports: [CommonModule, ReactiveFormsModule, RutFormatDirective],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.scss'
})
export class DriverFormComponent implements OnInit {
  @Input() data?: { driver?: Driver };
  modalRef!: ModalRef<CreateDriverDto>;

  private fb = inject(FormBuilder);
  driverForm!: FormGroup;
  driver: Driver | null = null;

  ngOnInit(): void {
    this.driver = this.data?.driver || null;

    this.driverForm = this.fb.group({
      rut: [this.driver?.rut || '', [Validators.required, rutValidator()]],
      firstName: [this.driver?.firstName || '', Validators.required],
      lastName: [this.driver?.lastName || '', Validators.required],
      email: [this.driver?.email || '', [Validators.required, Validators.email]],
      phone: [this.driver?.phone || '', [Validators.required, Validators.pattern(/^\+?[\d\s-]+$/)]],
      licenseNumber: [this.driver?.licenseNumber || '', Validators.required],
      licenseType: [this.driver?.licenseType || 'A4', Validators.required],
      licenseExpiry: [this.driver?.licenseExpiry || '', Validators.required],
      hireDate: [this.driver?.hireDate || '', Validators.required],
      status: [this.driver?.status || 'active', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.driverForm.valid) {
      this.modalRef.close(this.driverForm.value);
    }
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  getErrorMessage(field: string): string {
    const control = this.driverForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['email']) {
      return 'Email inválido';
    }
    if (control.errors['invalidRut']) {
      return 'RUT inválido';
    }
    if (control.errors['pattern']) {
      if (field === 'phone') {
        return 'Formato de teléfono inválido';
      }
    }
    return '';
  }
}
