import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, CreateRoleDto } from '../../../../core/models/role.model';
import { GroupedPermissions, Permission } from '../../../../core/models/permission.model';
import { ModalRef } from '../../../../core/services/modal.service';
import { PermissionService } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-role-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
  @Input() data?: { role?: Role };
  modalRef!: ModalRef<CreateRoleDto>;

  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);

  roleForm!: FormGroup;
  role: Role | null = null;
  groupedPermissions = signal<GroupedPermissions>({});
  selectedPermissionIds = signal<Set<string>>(new Set());
  loading = signal(true);

  ngOnInit(): void {
    this.role = this.data?.role || null;

    // Initialize form
    this.roleForm = this.fb.group({
      name: [
        { value: this.role?.name || '', disabled: !!this.role },
        [Validators.required, Validators.pattern(/^[a-z_]+$/)]
      ],
      displayName: [this.role?.displayName || '', Validators.required],
      description: [this.role?.description || '']
    });

    // Load permissions
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.permissionService.findGroupedByResource().subscribe({
      next: (grouped) => {
        this.groupedPermissions.set(grouped);

        // Pre-select permissions if editing
        if (this.role?.rolePermissions) {
          const permissionIds = this.role.rolePermissions.map(rp => rp.permission.id);
          this.selectedPermissionIds.set(new Set(permissionIds));
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.loading.set(false);
      }
    });
  }

  togglePermission(permissionId: string): void {
    const selected = new Set(this.selectedPermissionIds());
    if (selected.has(permissionId)) {
      selected.delete(permissionId);
    } else {
      selected.add(permissionId);
    }
    this.selectedPermissionIds.set(selected);
  }

  toggleResource(resource: string): void {
    const permissions = this.groupedPermissions()[resource] || [];
    const selected = new Set(this.selectedPermissionIds());
    const allSelected = permissions.every(p => selected.has(p.id));

    if (allSelected) {
      // Deselect all permissions in this resource
      permissions.forEach(p => selected.delete(p.id));
    } else {
      // Select all permissions in this resource
      permissions.forEach(p => selected.add(p.id));
    }

    this.selectedPermissionIds.set(selected);
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissionIds().has(permissionId);
  }

  isResourceFullySelected(resource: string): boolean {
    const permissions = this.groupedPermissions()[resource] || [];
    return permissions.length > 0 && permissions.every(p => this.isPermissionSelected(p.id));
  }

  isResourcePartiallySelected(resource: string): boolean {
    const permissions = this.groupedPermissions()[resource] || [];
    const selectedCount = permissions.filter(p => this.isPermissionSelected(p.id)).length;
    return selectedCount > 0 && selectedCount < permissions.length;
  }

  getResourceKeys(): string[] {
    return Object.keys(this.groupedPermissions());
  }

  getResourceDisplayName(resource: string): string {
    const names: Record<string, string> = {
      customer: 'Clientes',
      vehicle: 'Vehículos',
      driver: 'Conductores',
      trip: 'Viajes',
      invoice: 'Facturas',
      transaction: 'Transacciones',
      user: 'Usuarios',
      role: 'Roles',
      maintenance: 'Mantenimientos',
      supplier: 'Proveedores'
    };
    return names[resource] || resource;
  }

  getActionDisplayName(action: string): string {
    const names: Record<string, string> = {
      CREATE: 'Crear',
      READ: 'Ver',
      UPDATE: 'Editar',
      DELETE: 'Eliminar',
      EXPORT: 'Exportar',
      MANAGE_ROLES: 'Gestionar Roles',
      READ_OWN: 'Ver Propios'
    };
    return names[action] || action;
  }

  onSubmit(): void {
    if (this.roleForm.valid && this.selectedPermissionIds().size > 0) {
      const formValue = this.roleForm.getRawValue();
      const roleData: CreateRoleDto = {
        ...formValue,
        permissionIds: Array.from(this.selectedPermissionIds())
      };
      this.modalRef.close(roleData);
    } else if (this.selectedPermissionIds().size === 0) {
      alert('Debes seleccionar al menos un permiso');
    }
  }

  onCancel(): void {
    this.modalRef.dismiss('cancelled');
  }

  getErrorMessage(field: string): string {
    const control = this.roleForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['pattern']) {
      if (field === 'name') {
        return 'Solo minúsculas y guión bajo (ej: custom_role)';
      }
    }
    return '';
  }
}
