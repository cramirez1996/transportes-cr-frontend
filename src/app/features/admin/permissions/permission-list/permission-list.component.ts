import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionService } from '../../../../core/services/permission.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Permission } from '../../../../core/models/permission.model';

@Component({
  selector: 'app-permission-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.scss'
})
export class PermissionListComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  permissions = signal<Permission[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  selectedResource = signal<string>('all');

  // Computed: check if user is super_admin
  isSuperAdmin = computed(() => this.authService.isSuperAdmin());

  // Computed: unique resources for filter
  resources = computed(() => {
    const allPermissions = this.permissions();
    const uniqueResources = new Set(allPermissions.map(p => p.resource));
    return Array.from(uniqueResources).sort();
  });

  // Computed: filtered permissions
  filteredPermissions = computed(() => {
    let filtered = this.permissions();

    // Filter by resource
    if (this.selectedResource() !== 'all') {
      filtered = filtered.filter(p => p.resource === this.selectedResource());
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.displayName.toLowerCase().includes(search) ||
        p.resource.toLowerCase().includes(search) ||
        p.action.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  // Computed: permissions grouped by resource
  groupedPermissions = computed(() => {
    const filtered = this.filteredPermissions();
    const grouped: Record<string, Permission[]> = {};

    filtered.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });

    return grouped;
  });

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.permissionService.findAll().subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.loading.set(false);
      }
    });
  }

  deletePermission(permission: Permission): void {
    if (!confirm(`¿Estás seguro de eliminar el permiso "${permission.name}"?\n\nEsta acción no se puede deshacer y puede afectar roles existentes.`)) {
      return;
    }

    this.permissionService.delete(permission.id).subscribe({
      next: () => {
        this.loadPermissions();
      },
      error: (err) => {
        console.error('Error deleting permission:', err);
        if (err.status === 400) {
          alert(`No se puede eliminar este permiso porque está asignado a uno o más roles.\n\nPrimero debes removerlo de todos los roles.`);
        } else if (err.status === 403) {
          alert('No tienes permisos para eliminar permisos. Se requieren privilegios de Super Admin.');
        } else {
          alert('Error al eliminar el permiso. Por favor intenta de nuevo.');
        }
      }
    });
  }

  getResourceKeys(): string[] {
    return Object.keys(this.groupedPermissions()).sort();
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
      dashboard: 'Dashboard',
      notification: 'Notificaciones'
    };
    return names[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
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
      BROADCAST: 'Enviar Notificaciones'
    };
    return names[action] || action;
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
      BROADCAST: 'bg-pink-100 text-pink-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  }
}
