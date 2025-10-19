import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalRef } from '../../../../core/services/modal.service';
import { Role } from '../../../../core/models/user.model';

export interface AssignRoleModalData {
  availableTenants: any[];
  roles: Role[];
}

@Component({
  selector: 'app-assign-role-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './assign-role-modal.component.html',
  styleUrl: './assign-role-modal.component.scss'
})
export class AssignRoleModalComponent implements OnInit {
  modalRef?: ModalRef;
  data?: AssignRoleModalData;
  roleForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.roleForm = this.fb.group({
      tenantId: ['', Validators.required],
      roleId: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Data is injected by ModalService
  }

  get availableTenants(): any[] {
    return this.data?.availableTenants || [];
  }

  get roles(): Role[] {
    return this.data?.roles || [];
  }

  onSubmit(): void {
    if (this.roleForm.valid && this.modalRef) {
      this.modalRef.close(this.roleForm.value);
    }
  }

  onCancel(): void {
    if (this.modalRef) {
      this.modalRef.dismiss('cancelled');
    }
  }
}
