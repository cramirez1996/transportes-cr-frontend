import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User, TenantUser } from '../../../../core/models/user.model';
import { UserRole } from '../../../../core/models/enums/user-role.enum';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    PaginationComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  users: User[] = [];
  loading = false;
  error: string | null = null;

  currentUserRole: UserRole | null = null;
  currentTenantId: string | null = null;

  // Pagination
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  // Modal
  showDeleteModal = false;
  userToDelete: User | null = null;

  // Form
  filterForm!: FormGroup;

  // Advanced filters toggle
  showAdvancedFilters = false;

  // Expose Math for template
  Math = Math;

  // Getters for template binding compatibility
  get filters() {
    return this.filterForm?.value || {};
  }

  set filters(value: any) {
    if (this.filterForm) {
      this.filterForm.patchValue(value, { emitEvent: false });
    }
  }

  // Active filters count
  get activeFiltersCount(): number {
    if (!this.filterForm) return 0;
    const values = this.filterForm.value;
    return Object.keys(values).filter(key => {
      const value = values[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserRole = user?.role.name as UserRole || null;
    this.currentTenantId = this.authService.getCurrentTenant()?.id || null;

    this.initializeForm();
    this.subscribeToQueryParams();
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      // Basic filters
      search: [null],
      status: [null],
      role: [null],

      // Advanced filters
      tenantId: [null],

      // Sorting
      sortBy: ['createdAt'],
      sortOrder: ['DESC']
    });
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Pagination
        this.page = params['page'] ? Number(params['page']) : 1;
        this.limit = params['limit'] ? Number(params['limit']) : 10;

        // Update form with query params (without emitting to avoid loop)
        this.filterForm.patchValue({
          search: params['search'] || null,
          status: params['status'] || null,
          role: params['role'] || null,
          tenantId: params['tenantId'] || null,
          sortBy: params['sortBy'] || 'createdAt',
          sortOrder: params['sortOrder'] || 'DESC'
        }, { emitEvent: false });

        // Show advanced filters if any advanced filter is present
        this.showAdvancedFilters = !!(params['tenantId']);

        this.loadUsers();
      });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.page = 1; // Reset to first page on filter change
        this.updateQueryParams();
      });
  }

  // Method for template compatibility with ngModel
  onFilterChange(): void {
    this.page = 1;
    this.updateQueryParams();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const formValue = this.filterForm.value;
    const params: any = {
      page: this.page,
      limit: this.limit
    };

    // Add filters from form
    if (formValue.search) {
      params.search = formValue.search;
    }

    if (formValue.status) {
      params.status = formValue.status;
    }

    if (formValue.role) {
      params.role = formValue.role;
    }

    if (formValue.tenantId) {
      params.tenantId = formValue.tenantId;
    }

    // Admin only sees users from their tenants
    if (this.currentUserRole === UserRole.ADMIN && this.currentTenantId) {
      params.tenantId = this.currentTenantId;
    }

    // Add sorting
    if (formValue.sortBy) {
      params.sortBy = formValue.sortBy;
    }
    if (formValue.sortOrder) {
      params.sortOrder = formValue.sortOrder;
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        this.users = response.data;
        this.total = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = Math.ceil(this.total / this.limit);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los usuarios';
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
    this.page = 1;
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
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
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error toggling user status:', error);
        alert('Error al actualizar el estado del usuario');
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
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        alert('Error al eliminar el usuario');
        this.showDeleteModal = false;
        this.userToDelete = null;
      }
    });
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.page = Number(page);
    this.updateQueryParams();
    this.loadUsers();
  }

  onLimitChange(limit: number): void {
    this.limit = Number(limit);
    this.page = 1;
    this.updateQueryParams();
    this.loadUsers();
  }

  private updateQueryParams(): void {
    const formValue = this.filterForm.value;
    const queryParams: any = {
      page: this.page,
      limit: this.limit
    };

    // Add form values to query params (excluding null/undefined/empty)
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
  }

  get canCreateUser(): boolean {
    return this.currentUserRole === UserRole.SUPER_ADMIN ||
           this.currentUserRole === UserRole.ADMIN;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      SUSPENDED: 'Suspendido'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }
}
