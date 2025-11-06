import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PermissionService, CreatePermissionDto, UpdatePermissionDto } from '../../../../core/services/permission.service';
import { Permission, PermissionAction } from '../../../../core/models/permission.model';

@Component({
  selector: 'app-permission-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './permission-form.component.html',
  styleUrl: './permission-form.component.scss'
})
export class PermissionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private permissionService = inject(PermissionService);

  permissionForm!: FormGroup;
  permissionId: string | null = null;
  permission: Permission | null = null;
  loading = signal(true);
  submitting = signal(false);

  // Available actions from enum
  availableActions: PermissionAction[] = [
    PermissionAction.CREATE,
    PermissionAction.READ,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.EXPORT,
    PermissionAction.MANAGE_ROLES,
    PermissionAction.READ_OWN,
    PermissionAction.BROADCAST
  ];

  // Computed: is editing mode?
  isEditMode = computed(() => this.permissionId !== null);

  ngOnInit(): void {
    this.permissionId = this.route.snapshot.paramMap.get('id');

    // Initialize form
    this.permissionForm = this.fb.group({
      resource: [
        { value: '', disabled: !!this.permissionId },
        [Validators.required, Validators.pattern(/^[a-z_]+$/)]
      ],
      action: [
        { value: '', disabled: !!this.permissionId },
        Validators.required
      ],
      displayName: ['', Validators.required],
      description: ['']
    });

    // If editing, load permission data
    if (this.permissionId) {
      this.loadPermission(this.permissionId);
    } else {
      this.loading.set(false);
    }
  }

  loadPermission(id: string): void {
    this.permissionService.findOne(id).subscribe({
      next: (permission) => {
        this.permission = permission;
        this.permissionForm.patchValue({
          resource: permission.resource,
          action: permission.action,
          displayName: permission.displayName,
          description: permission.description
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading permission:', err);
        alert('Error al cargar el permiso. Redirigiendo...');
        this.router.navigate(['/admin/permissions']);
      }
    });
  }

  onSubmit(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.permissionForm.getRawValue(); // getRawValue includes disabled fields

    if (this.permissionId) {
      // Update existing permission
      const updateDto: UpdatePermissionDto = {
        displayName: formValue.displayName,
        description: formValue.description
      };

      this.permissionService.update(this.permissionId, updateDto).subscribe({
        next: () => {
          this.router.navigate(['/admin/permissions']);
        },
        error: (err) => {
          console.error('Error updating permission:', err);
          this.handleError(err);
          this.submitting.set(false);
        }
      });
    } else {
      // Create new permission
      const createDto: CreatePermissionDto = {
        resource: formValue.resource.toLowerCase(),
        action: formValue.action,
        displayName: formValue.displayName,
        description: formValue.description
      };

      this.permissionService.create(createDto).subscribe({
        next: () => {
          this.router.navigate(['/admin/permissions']);
        },
        error: (err) => {
          console.error('Error creating permission:', err);
          this.handleError(err);
          this.submitting.set(false);
        }
      });
    }
  }

  handleError(err: any): void {
    if (err.status === 409) {
      alert('Ya existe un permiso con este recurso y acción.');
    } else if (err.status === 400) {
      const message = err.error?.message || 'Datos inválidos. Verifica el formulario.';
      alert(message);
    } else if (err.status === 403) {
      alert('No tienes permisos para realizar esta acción. Se requieren privilegios de Super Admin.');
    } else {
      alert('Error al guardar el permiso. Por favor intenta de nuevo.');
    }
  }

  getErrorMessage(fieldName: string): string | null {
    const control = this.permissionForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }

    if (control.errors['pattern']) {
      return 'Solo minúsculas y guión bajo (ej: customer, trip_group)';
    }

    return null;
  }

  getActionDisplayName(action: PermissionAction): string {
    const names: Record<string, string> = {
      [PermissionAction.CREATE]: 'Crear (CREATE)',
      [PermissionAction.READ]: 'Ver (READ)',
      [PermissionAction.UPDATE]: 'Editar (UPDATE)',
      [PermissionAction.DELETE]: 'Eliminar (DELETE)',
      [PermissionAction.EXPORT]: 'Exportar (EXPORT)',
      [PermissionAction.MANAGE_ROLES]: 'Gestionar Roles (MANAGE_ROLES)',
      [PermissionAction.READ_OWN]: 'Ver Propios (READ_OWN)',
      [PermissionAction.BROADCAST]: 'Enviar Notificaciones (BROADCAST)'
    };
    return names[action] || action;
  }

  cancel(): void {
    this.router.navigate(['/admin/permissions']);
  }
}
