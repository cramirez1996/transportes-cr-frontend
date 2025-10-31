import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaintenanceStatus } from '../../../../core/models/maintenance.model';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { ModalRef } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-maintenance-change-status-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './maintenance-change-status-modal.component.html',
  styleUrl: './maintenance-change-status-modal.component.scss'
})
export class MaintenanceChangeStatusModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);

  // Injected by ModalService
  modalRef!: ModalRef;
  data!: {
    maintenanceId: string;
    currentStatus: MaintenanceStatus;
    targetStatus: MaintenanceStatus;
  };

  changeStatusForm!: FormGroup;
  loading = false;
  error: string | null = null;

  MaintenanceStatus = MaintenanceStatus;

  ngOnInit(): void {
    this.initForm();
    this.setupFormValidation();
  }

  initForm(): void {
    this.changeStatusForm = this.fb.group({
      executedDate: [''],
      vehicleKmAtMaintenance: [''],
      notes: ['']
    });
  }

  setupFormValidation(): void {
    // Si el estado objetivo es COMPLETED, requerir datos adicionales
    if (this.data.targetStatus === MaintenanceStatus.COMPLETED) {
      this.changeStatusForm.get('executedDate')?.setValidators([Validators.required]);
      this.changeStatusForm.get('vehicleKmAtMaintenance')?.setValidators([Validators.required, Validators.min(0)]);

      // Establecer fecha de hoy por defecto
      const today = new Date().toISOString().split('T')[0];
      this.changeStatusForm.patchValue({
        executedDate: today,
        vehicleKmAtMaintenance: '',
        notes: ''
      });
    }

    this.changeStatusForm.get('executedDate')?.updateValueAndValidity();
    this.changeStatusForm.get('vehicleKmAtMaintenance')?.updateValueAndValidity();
  }

  close(): void {
    this.modalRef.dismiss();
  }

  onSubmit(): void {
    // Si el estado objetivo es COMPLETED, validar el formulario
    if (this.data.targetStatus === MaintenanceStatus.COMPLETED) {
      if (this.changeStatusForm.invalid) {
        this.changeStatusForm.markAllAsTouched();
        return;
      }
    }

    this.loading = true;
    this.error = null;

    const formValue = this.changeStatusForm.value;

    // Preparar datos para actualizar
    const updateData: any = {
      status: this.data.targetStatus
    };

    // Si es COMPLETED, agregar datos adicionales
    if (this.data.targetStatus === MaintenanceStatus.COMPLETED) {
      updateData.executedDate = formValue.executedDate ? new Date(formValue.executedDate) : undefined;
      updateData.vehicleKmAtMaintenance = formValue.vehicleKmAtMaintenance ? parseInt(formValue.vehicleKmAtMaintenance, 10) : undefined;
      updateData.notes = formValue.notes || undefined;
    }

    // El modal hace la llamada a la API
    this.maintenanceService.updateMaintenanceRecord(this.data.maintenanceId, updateData).subscribe({
      next: (updatedRecord) => {
        // Éxito - cerrar modal y devolver resultado
        this.loading = false;
        this.modalRef.close(updatedRecord);
      },
      error: (error) => {
        // Error - mostrar en el modal, NO cerrar
        console.error('Error updating maintenance status:', error);
        this.error = error.error?.message || 'Error al actualizar el estado del mantenimiento';
        this.loading = false;
      }
    });
  }

  getStatusLabel(status: MaintenanceStatus): string {
    const labels = {
      [MaintenanceStatus.SCHEDULED]: 'Programado',
      [MaintenanceStatus.COMPLETED]: 'Completado',
      [MaintenanceStatus.OVERDUE]: 'Vencido',
      [MaintenanceStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status];
  }

  get showAdditionalFields(): boolean {
    return this.data.targetStatus === MaintenanceStatus.COMPLETED;
  }

  get confirmationMessage(): string {
    if (this.data.targetStatus === MaintenanceStatus.COMPLETED) {
      return 'Complete los siguientes datos para marcar el mantenimiento como completado:';
    } else if (this.data.targetStatus === MaintenanceStatus.CANCELLED) {
      return '¿Está seguro de cancelar este mantenimiento? Esta acción no se puede deshacer.';
    } else {
      return `¿Está seguro de cambiar el estado a "${this.getStatusLabel(this.data.targetStatus)}"?`;
    }
  }
}
