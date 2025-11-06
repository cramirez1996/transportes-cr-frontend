import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Role, CreateRoleDto, UpdateRoleDto } from '../../../../core/models/role.model';
import { GroupedPermissions, Permission } from '../../../../core/models/permission.model';
import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { AuthService } from '../../../../core/services/auth.service';

interface ResourceCategory {
  key: string;
  label: string;
  resources: string[];
  icon: string;
}

@Component({
  selector: 'app-role-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  roleForm!: FormGroup;
  roleId: string | null = null;
  role: Role | null = null;
  groupedPermissions = signal<GroupedPermissions>({});
  selectedPermissionIds = signal<Set<string>>(new Set());
  loading = signal(true);
  submitting = signal(false);
  activeCategory = signal<string>('');

  // Computed signal: is editing a system role?
  isEditingSystemRole = computed(() => {
    return this.role !== null && this.role.isSystem === true;
  });

  // Computed signal: dynamically generate categories from available resources
  permissionTabs = computed<ResourceCategory[]>(() => {
    const resources = Object.keys(this.groupedPermissions());

    // Category definitions with flexible resource assignment
    const categoryDefinitions: Record<string, { label: string; icon: string; priority: number; matcher: (resource: string) => boolean }> = {
      operations: {
        label: 'Operaciones',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        priority: 1,
        matcher: (r) => ['customer', 'trip', 'driver'].includes(r)
      },
      finance: {
        label: 'Finanzas',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        priority: 2,
        matcher: (r) => ['invoice', 'transaction', 'supplier'].includes(r)
      },
      fleet: {
        label: 'Flota',
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
        priority: 3,
        matcher: (r) => ['vehicle', 'maintenance'].includes(r)
      },
      admin: {
        label: 'Administración',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        priority: 4,
        matcher: (r) => ['user', 'role', 'tenant'].includes(r)
      },
      system: {
        label: 'Sistema',
        icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        priority: 5,
        matcher: (r) => ['notification', 'report', 'dashboard', 'analytics', 'audit'].includes(r)
      }
    };

    // Build categories from available resources
    const categories = new Map<string, ResourceCategory>();

    resources.forEach(resource => {
      // Find which category this resource belongs to
      let categoryKey = 'other';
      for (const [key, def] of Object.entries(categoryDefinitions)) {
        if (def.matcher(resource)) {
          categoryKey = key;
          break;
        }
      }

      // Get or create category
      if (!categories.has(categoryKey)) {
        const def = categoryDefinitions[categoryKey];
        categories.set(categoryKey, {
          key: categoryKey,
          label: def?.label || 'Otros',
          resources: [],
          icon: def?.icon || 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
        });
      }

      categories.get(categoryKey)!.resources.push(resource);
    });

    // Convert to array and sort by priority
    const result = Array.from(categories.values());
    result.sort((a, b) => {
      const priorityA = categoryDefinitions[a.key]?.priority || 999;
      const priorityB = categoryDefinitions[b.key]?.priority || 999;
      return priorityA - priorityB;
    });

    return result;
  });

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');

    // Initialize form
    this.roleForm = this.fb.group({
      name: [
        { value: '', disabled: !!this.roleId },
        [Validators.required, Validators.pattern(/^[a-z_]+$/)]
      ],
      displayName: ['', Validators.required],
      description: ['']
    });

    // Load permissions first
    this.loadPermissions();

    // If editing, load role data
    if (this.roleId) {
      this.loadRole(this.roleId);
    }
  }

  loadRole(id: string): void {
    this.roleService.findOne(id).subscribe({
      next: (role) => {
        this.role = role;
        this.roleForm.patchValue({
          name: role.name,
          displayName: role.displayName,
          description: role.description
        });

        // Pre-select permissions if editing
        if (role.rolePermissions) {
          const permissionIds = role.rolePermissions.map(rp => rp.permission.id);
          this.selectedPermissionIds.set(new Set(permissionIds));
        }
      },
      error: (err) => {
        console.error('Error loading role:', err);
        this.router.navigate(['/admin/roles']);
      }
    });
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.permissionService.findGroupedByResource().subscribe({
      next: (grouped) => {
        this.groupedPermissions.set(grouped);
        this.loading.set(false);

        // Set first category as active if none selected
        if (!this.activeCategory() && this.permissionTabs().length > 0) {
          this.activeCategory.set(this.permissionTabs()[0].key);
        }
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.loading.set(false);
      }
    });
  }

  setActiveCategory(category: string): void {
    this.activeCategory.set(category);
  }

  getResourcesForCategory(category: string): string[] {
    const tab = this.permissionTabs().find(t => t.key === category);
    return tab?.resources || [];
  }

  getAvailableResourcesForCategory(category: string): string[] {
    const categoryResources = this.getResourcesForCategory(category);
    const allResources = Object.keys(this.groupedPermissions());
    return allResources.filter(resource => categoryResources.includes(resource));
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

  selectAllInCategory(category: string): void {
    const resources = this.getAvailableResourcesForCategory(category);
    const selected = new Set(this.selectedPermissionIds());

    resources.forEach(resource => {
      const permissions = this.groupedPermissions()[resource] || [];
      permissions.forEach(p => selected.add(p.id));
    });

    this.selectedPermissionIds.set(selected);
  }

  deselectAllInCategory(category: string): void {
    const resources = this.getAvailableResourcesForCategory(category);
    const selected = new Set(this.selectedPermissionIds());

    resources.forEach(resource => {
      const permissions = this.groupedPermissions()[resource] || [];
      permissions.forEach(p => selected.delete(p.id));
    });

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

  isCategoryFullySelected(category: string): boolean {
    const resources = this.getAvailableResourcesForCategory(category);
    return resources.length > 0 && resources.every(r => this.isResourceFullySelected(r));
  }

  isCategoryPartiallySelected(category: string): boolean {
    const resources = this.getAvailableResourcesForCategory(category);
    const hasAnySelected = resources.some(r => {
      const permissions = this.groupedPermissions()[r] || [];
      return permissions.some(p => this.isPermissionSelected(p.id));
    });
    return hasAnySelected && !this.isCategoryFullySelected(category);
  }

  getCategoryPermissionCount(category: string): { selected: number; total: number } {
    const resources = this.getAvailableResourcesForCategory(category);
    let selected = 0;
    let total = 0;

    resources.forEach(resource => {
      const permissions = this.groupedPermissions()[resource] || [];
      total += permissions.length;
      selected += permissions.filter(p => this.isPermissionSelected(p.id)).length;
    });

    return { selected, total };
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
      supplier: 'Proveedores',
      notification: 'Notificaciones',
      tenant: 'Empresas',
      report: 'Reportes',
      dashboard: 'Dashboard',
      analytics: 'Analíticas',
      audit: 'Auditoría'
    };
    return names[resource] || this.capitalizeFirst(resource);
  }

  getActionDisplayName(action: string): string {
    const names: Record<string, string> = {
      CREATE: 'Crear',
      READ: 'Ver',
      UPDATE: 'Editar',
      DELETE: 'Eliminar',
      EXPORT: 'Exportar',
      MANAGE_ROLES: 'Gestionar Roles',
      READ_OWN: 'Ver Propios',
      BROADCAST: 'Difundir'
    };
    return names[action] || this.capitalizeFirst(action);
  }

  getActionBadgeColor(action: string): string {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      READ: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      EXPORT: 'bg-purple-100 text-purple-800',
      MANAGE_ROLES: 'bg-indigo-100 text-indigo-800',
      READ_OWN: 'bg-cyan-100 text-cyan-800',
      BROADCAST: 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getSelectedPermissionCountForResource(resource: string): number {
    const permissions = this.groupedPermissions()[resource] || [];
    return permissions.filter(p => this.isPermissionSelected(p.id)).length;
  }

  onSubmit(): void {
    if (this.roleForm.valid && this.selectedPermissionIds().size > 0) {
      this.submitting.set(true);

      const formValue = this.roleForm.getRawValue();
      const permissionIds = Array.from(this.selectedPermissionIds());

      if (this.roleId) {
        // Update existing role
        const updateDto: UpdateRoleDto = {
          displayName: formValue.displayName,
          description: formValue.description,
          permissionIds
        };

        this.roleService.update(this.roleId, updateDto).subscribe({
          next: () => {
            this.submitting.set(false);
            this.router.navigate(['/admin/roles', this.roleId]);
          },
          error: (err) => {
            console.error('Error updating role:', err);
            this.submitting.set(false);
            alert('Error al actualizar el rol. Por favor intenta de nuevo.');
          }
        });
      } else {
        // Create new role
        const createDto: CreateRoleDto = {
          name: formValue.name,
          displayName: formValue.displayName,
          description: formValue.description,
          permissionIds
        };

        this.roleService.create(createDto).subscribe({
          next: (role) => {
            this.submitting.set(false);
            this.router.navigate(['/admin/roles', role.id]);
          },
          error: (err) => {
            console.error('Error creating role:', err);
            this.submitting.set(false);
            alert('Error al crear el rol. Por favor intenta de nuevo.');
          }
        });
      }
    } else if (this.selectedPermissionIds().size === 0) {
      alert('Debes seleccionar al menos un permiso');
    }
  }

  onCancel(): void {
    if (this.roleId) {
      this.router.navigate(['/admin/roles', this.roleId]);
    } else {
      this.router.navigate(['/admin/roles']);
    }
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
