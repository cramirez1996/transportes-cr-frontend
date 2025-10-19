import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User, TenantUser } from '../../../../core/models/user.model';
import { UserRole } from '../../../../core/models/enums/user-role.enum';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus = 'all';
  currentUserRole: UserRole | null = null;
  currentTenantId: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Modal
  showDeleteModal = false;
  userToDelete: User | null = null;

  // Expose Math for template
  Math = Math;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserRole = user?.role.name as UserRole || null;
    this.currentTenantId = this.authService.getCurrentTenant()?.id || null;
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.selectedStatus !== 'all') {
      params.isActive = this.selectedStatus === 'active';
    }

    // Admin only sees users from their tenants
    if (this.currentUserRole === UserRole.ADMIN && this.currentTenantId) {
      params.tenantId = this.currentTenantId;
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        console.log('AQUI', response)
        this.users = response.data;
        this.filteredUsers = this.users;
        this.totalUsers = response.total;
        this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  getTenantNames(user: User): string {
    if (!user.tenantUsers || user.tenantUsers.length === 0) {
      return 'N/A';
    }
    return user.tenantUsers
      .map(tu => tu.tenant?.tradeName || tu.tenant?.businessName || 'Unknown')
      .join(', ');
  }

  getRoleNames(user: User): string {
    if (!user.tenantUsers || user.tenantUsers.length === 0) {
      return 'N/A';
    }
    const roles = user.tenantUsers
      .map(tu => tu.role?.name || 'Unknown')
      .filter((value, index, self) => self.indexOf(value) === index);
    return roles.join(', ');
  }

  toggleStatus(user: User): void {
    const action = user.status === 'ACTIVE'
      ? this.userService.deactivateUser(user.id)
      : this.userService.activateUser(user.id);

    action.subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.filteredUsers = [...this.users];
        }
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        alert('Error updating user status');
      }
    });
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser(): void {
    if (!this.userToDelete) return;

    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete?.id);
        this.filteredUsers = [...this.users];
        this.totalUsers--;
        this.showDeleteModal = false;
        this.userToDelete = null;

        // Reload if current page is empty
        if (this.users.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          this.loadUsers();
        }
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
        this.showDeleteModal = false;
        this.userToDelete = null;
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  get canCreateUser(): boolean {
    return this.currentUserRole === UserRole.SUPER_ADMIN ||
           this.currentUserRole === UserRole.ADMIN;
  }
}
