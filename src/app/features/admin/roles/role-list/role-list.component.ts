import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Role } from '../../../../core/models/role.model';

@Component({
  selector: 'app-role-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss'
})
export class RoleListComponent implements OnInit {
  roles = signal<Role[]>([]);
  loading = signal(false);

  private roleService = inject(RoleService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.findAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.loading.set(false);
      }
    });
  }

  deleteRole(role: Role): void {
    // System roles cannot be deleted (even by super_admin)
    if (role.isSystem) {
      alert('Los roles del sistema no pueden ser eliminados');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el rol "${role.displayName}"?\n\nEsta acción no se puede deshacer.`)) {
      this.roleService.delete(role.id).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          if (err.status === 400) {
            alert('No se puede eliminar un rol que está asignado a usuarios');
          } else {
            alert('Error al eliminar el rol. Por favor intenta de nuevo.');
          }
        }
      });
    }
  }

  getPermissionCount(role: Role): number {
    return role.rolePermissions?.length || 0;
  }

  /**
   * Check if a role can be edited
   * Custom roles can always be edited
   * System roles can only be edited by super_admin
   */
  canEdit(role: Role): boolean {
    if (!role.isSystem) {
      return true; // Custom roles can always be edited
    }
    return this.authService.isSuperAdmin(); // System roles only by super_admin
  }
}
