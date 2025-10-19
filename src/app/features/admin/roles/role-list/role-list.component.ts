import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../../core/services/role.service';
import { Role } from '../../../../core/models/role.model';
import { ModalService } from '../../../../core/services/modal.service';
import { RoleFormComponent } from '../role-form/role-form.component';

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
  private modalService = inject(ModalService);

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

  openCreateModal(): void {
    const modalRef = this.modalService.open(RoleFormComponent, {
      title: 'Nuevo Rol'
    });

    modalRef.result
      .then((roleData) => {
        this.roleService.create(roleData).subscribe({
          next: () => this.loadRoles(),
          error: (err) => console.error('Error creating role:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(role: Role): void {
    // System roles cannot be edited
    if (role.isSystem) {
      alert('Los roles del sistema no pueden ser modificados');
      return;
    }

    const modalRef = this.modalService.open(RoleFormComponent, {
      title: 'Editar Rol',
      data: { role }
    });

    modalRef.result
      .then((roleData) => {
        this.roleService.update(role.id, roleData).subscribe({
          next: () => this.loadRoles(),
          error: (err) => console.error('Error updating role:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  deleteRole(role: Role): void {
    // System roles cannot be deleted
    if (role.isSystem) {
      alert('Los roles del sistema no pueden ser eliminados');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el rol "${role.displayName}"?`)) {
      this.roleService.delete(role.id).subscribe({
        next: () => {
          this.loadRoles();
        },
        error: (err) => {
          console.error('Error deleting role:', err);
          if (err.status === 400) {
            alert('No se puede eliminar un rol que está asignado a usuarios');
          }
        }
      });
    }
  }

  getPermissionCount(role: Role): number {
    return role.rolePermissions?.length || 0;
  }
}
