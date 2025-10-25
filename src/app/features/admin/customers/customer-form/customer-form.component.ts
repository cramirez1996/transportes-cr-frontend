import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer, CreateCustomerDto, CustomerStatus } from '../../../../core/models/business/customer.model';
import { ModalRef } from '../../../../core/services/modal.service';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { rutValidator, normalizeRut } from '../../../../shared/validators/rut.validator';
import { RutFormatDirective } from '../../../../shared/directives/rut-format.directive';
import { TagsEditorComponent } from '../../../../shared/components/tags-editor/tags-editor.component';

@Component({
  selector: 'app-customer-form',
  imports: [CommonModule, ReactiveFormsModule, RutFormatDirective, TagsEditorComponent],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
  @Input() data?: { customer?: Customer };
  modalRef!: ModalRef<boolean>;

  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);

  customerForm!: FormGroup;
  customer: Customer | null = null;

  // Loading and error states
  isSubmitting = false;
  apiError: string | null = null;

  ngOnInit(): void {
    this.customer = this.data?.customer || null;

    this.customerForm = this.fb.group({
      rut: [this.customer?.rut || '', [Validators.required, rutValidator()]],
      businessName: [this.customer?.businessName || '', Validators.required],
      contactName: [this.customer?.contactName || '', Validators.required],
      email: [this.customer?.email || '', [Validators.required, Validators.email]],
      phone: [this.customer?.phone || '', [Validators.required, Validators.pattern(/^\+?[\d\s-]+$/)]],
      address: [this.customer?.address || '', Validators.required],
      city: [this.customer?.city || '', Validators.required],
      region: [this.customer?.region || '', Validators.required],
      status: [this.customer?.status || CustomerStatus.ACTIVE, Validators.required],
      tags: [this.customer?.tags || {}]
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;

    const formValue = { ...this.customerForm.value };

    // Normalize RUT before sending to backend
    if (formValue.rut) {
      formValue.rut = normalizeRut(formValue.rut);
    }

    const request = this.customer
      ? this.customerService.updateCustomer(this.customer.id, formValue)
      : this.customerService.createCustomer(formValue);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.modalRef.close(true); // Return true to indicate success
      },
      error: (error) => {
        this.isSubmitting = false;

        // Handle different error types
        if (error.status === 400) {
          // Validation errors from backend
          if (error.error?.message) {
            this.apiError = Array.isArray(error.error.message)
              ? error.error.message.join(', ')
              : error.error.message;
          } else {
            this.apiError = 'Error de validación. Por favor, revise los datos ingresados.';
          }
        } else if (error.status === 409) {
          // Conflict (e.g., duplicate RUT)
          this.apiError = error.error?.message || 'Ya existe un cliente con ese RUT.';
        } else if (error.status === 0) {
          // Network error
          this.apiError = 'Error de conexión. Por favor, verifique su conexión a internet.';
        } else {
          // Generic error
          this.apiError = error.error?.message || 'Error al guardar el cliente. Por favor, intente nuevamente.';
        }

        console.error('Error saving customer:', error);
      }
    });
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  onTagsChange(tags: Record<string, any>): void {
    this.customerForm.patchValue({ tags });
  }

  getErrorMessage(field: string): string {
    const control = this.customerForm.get(field);
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
