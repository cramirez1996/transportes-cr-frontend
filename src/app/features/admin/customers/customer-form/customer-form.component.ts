import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer, CreateCustomerDto, CustomerStatus } from '../../../../core/models/business/customer.model';
import { ModalRef } from '../../../../core/services/modal.service';
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
  modalRef!: ModalRef<CreateCustomerDto>;

  private fb = inject(FormBuilder);
  customerForm!: FormGroup;
  customer: Customer | null = null;

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
    if (this.customerForm.valid) {
      const formValue = { ...this.customerForm.value };

      // Normalize RUT before sending to backend
      if (formValue.rut) {
        formValue.rut = normalizeRut(formValue.rut);
      }

      this.modalRef.close(formValue);
    }
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
