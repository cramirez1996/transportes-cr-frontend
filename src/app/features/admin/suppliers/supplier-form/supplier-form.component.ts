import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supplier, CreateSupplierDto, SupplierType, SupplierStatus } from '../../../../core/models/supplier.model';
import { ModalRef } from '../../../../core/services/modal.service';
import { rutValidator } from '../../../../shared/validators/rut.validator';
import { RutFormatDirective } from '../../../../shared/directives/rut-format.directive';
import { TagsEditorComponent } from '../../../../shared/components/tags-editor/tags-editor.component';

@Component({
  selector: 'app-supplier-form',
  imports: [CommonModule, ReactiveFormsModule, RutFormatDirective, TagsEditorComponent],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent implements OnInit {
  @Input() data?: { supplier?: Supplier };
  modalRef!: ModalRef<CreateSupplierDto>;

  private fb = inject(FormBuilder);
  supplierForm!: FormGroup;
  supplier: Supplier | null = null;

  // Enums for template
  supplierTypes = Object.values(SupplierType);
  supplierStatuses = Object.values(SupplierStatus);

  // Labels for dropdown options
  supplierTypeLabels: Record<SupplierType, string> = {
    [SupplierType.FUEL]: 'Combustible',
    [SupplierType.MAINTENANCE]: 'Mantenimiento',
    [SupplierType.PARTS]: 'Repuestos',
    [SupplierType.INSURANCE]: 'Seguros',
    [SupplierType.SERVICE]: 'Servicios',
    [SupplierType.OTHER]: 'Otro',
  };

  supplierStatusLabels: Record<SupplierStatus, string> = {
    [SupplierStatus.ACTIVE]: 'Activo',
    [SupplierStatus.INACTIVE]: 'Inactivo',
  };

  ngOnInit(): void {
    this.supplier = this.data?.supplier || null;

    this.supplierForm = this.fb.group({
      rut: [this.supplier?.rut || '', [Validators.required, rutValidator()]],
      businessName: [this.supplier?.businessName || '', Validators.required],
      contactName: [this.supplier?.contactName || ''],
      email: [this.supplier?.email || '', Validators.email],
      phone: [this.supplier?.phone || '', Validators.pattern(/^\+?[\d\s-]+$/)],
      address: [this.supplier?.address || ''],
      city: [this.supplier?.city || ''],
      region: [this.supplier?.region || ''],
      supplierType: [this.supplier?.supplierType || SupplierType.OTHER, Validators.required],
      status: [this.supplier?.status || SupplierStatus.ACTIVE, Validators.required],
      tags: [this.supplier?.tags || {}]
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      this.modalRef.close(this.supplierForm.value);
    }
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  onTagsChange(tags: Record<string, any>): void {
    this.supplierForm.patchValue({ tags });
  }

  getErrorMessage(field: string): string {
    const control = this.supplierForm.get(field);
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
