import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/role.model';
import { Permission } from '../../../../core/models/permission.model';
import { User } from '../../../../core/models/user.model';

type TabKey = 'info' | 'permissions' | 'users';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-role-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.scss'
})
export class RoleDetailComponent implements OnInit {
  role = signal<Role | null>(null);
  permissions = signal<Permission[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  loadingUsers = signal(false);
  groupedPermissions = signal<Record<string, Permission[]>>({});
  activeTab = signal<TabKey>('info');

  tabs: Tab[] = [
    { key: 'info', label: 'Información', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'permissions', label: 'Permisos', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { key: 'users', label: 'Usuarios Asignados', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
  ];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);

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

  loadUsers(roleId: string): void {
    this.loadingUsers.set(true);
    this.roleService.getRoleUsers(roleId).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loadingUsers.set(false);
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

  setActiveTab(tab: TabKey): void {
    this.activeTab.set(tab);

    // Load users when users tab is activated for the first time
    if (tab === 'users' && this.users().length === 0 && this.role()) {
      this.loadUsers(this.role()!.id);
    }
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

  getUserFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getUserInitials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  navigateToEdit(): void {
    if (this.role() && this.canEdit()) {
      this.router.navigate(['/admin/roles', this.role()!.id, 'edit']);
    }
  }

  /**
   * Check if the current role can be edited
   * Custom roles can always be edited
   * System roles can only be edited by super_admin
   */
  canEdit(): boolean {
    const role = this.role();
    if (!role) return false;
    if (!role.isSystem) return true; // Custom roles can always be edited
    return this.authService.isSuperAdmin(); // System roles only by super_admin
  }
}
