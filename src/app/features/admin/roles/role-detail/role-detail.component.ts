import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Role } from '../../../../core/models/role.model';
import { Permission } from '../../../../core/models/permission.model';

@Component({
  selector: 'app-role-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent implements OnInit {
  role = signal<Role | null>(null);
  permissions = signal<Permission[]>([]);
  loading = signal(true);
  groupedPermissions = signal<Record<string, Permission[]>>({});

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roleService = inject(RoleService);

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.loadRole(roleId);
    }
  }

  loadRole(id: string): void {
    this.loading.set(true);
    this.roleService.findOne(id).subscribe({
      next: (role) => {
        this.role.set(role);
        this.loadPermissions(id);
      },
      error: (err) => {
        console.error('Error loading role:', err);
        this.loading.set(false);
        this.router.navigate(['/admin/roles']);
      }
    });
  }

  loadPermissions(roleId: string): void {
    this.roleService.getRolePermissions(roleId).subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.groupPermissionsByResource(permissions);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.loading.set(false);
      }
    });
  }

  groupPermissionsByResource(permissions: Permission[]): void {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    this.groupedPermissions.set(grouped);
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

  getActionBadgeColor(action: string): string {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      READ: 'bg-blue-100 text-blue-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      EXPORT: 'bg-purple-100 text-purple-800',
      MANAGE_ROLES: 'bg-indigo-100 text-indigo-800',
      READ_OWN: 'bg-cyan-100 text-cyan-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  }
}
