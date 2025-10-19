import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ModalService } from '../../../../core/services/modal.service';
import { User, Role, CreateUserRequest, UpdateUserRequest, AssignRoleRequest } from '../../../../core/models/user.model';
import { UserRole } from '../../../../core/models/enums/user-role.enum';
import { AssignRoleModalComponent, AssignRoleModalData } from '../assign-role-modal/assign-role-modal.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  userId: string | null = null;
  user: User | null = null;
  roles: Role[] = [];
  currentUserRole: UserRole | null = null;
  currentTenantId: string | null = null;
  userTenants: any[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private modalService: ModalService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    const user = this.authService.user();
    this.currentUserRole = user?.role.name as UserRole || null;
    this.currentTenantId = this.authService.getCurrentTenant()?.id || null;

    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId && this.userId !== 'new';

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    } else {
      // For create mode, set password as required
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }

    this.loadRoles();
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.userTenants = user.tenantUsers || [];
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          email: user.email,
          status: user.status || 'ACTIVE'
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        alert('Error loading user');
        this.router.navigate(['/admin/users']);
      }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.userId) {
      const updateData: UpdateUserRequest = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        phone: this.userForm.value.phone,
        email: this.userForm.value.email,
        status: this.userForm.value.status
      };

      // Only include password if it was provided
      if (this.userForm.value.password) {
        updateData.password = this.userForm.value.password;
      }

      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          alert('Error updating user');
          this.isSubmitting = false;
        }
      });
    } else {
      const createData: CreateUserRequest = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        phone: this.userForm.value.phone,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        status: this.userForm.value.status
      };

      // If Admin is creating, auto-assign to their tenant
      if (this.currentUserRole === UserRole.ADMIN && this.currentTenantId) {
        createData.tenantId = this.currentTenantId;
      }

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          alert('Error creating user');
          this.isSubmitting = false;
        }
      });
    }
  }

  openRoleModal(): void {
    const modalData: AssignRoleModalData = {
      availableTenants: this.availableTenants,
      roles: this.roles
    };

    const modalRef = this.modalService.open(AssignRoleModalComponent, {
      title: 'Assign Role to Tenant',
      data: modalData
    });

    modalRef.result
      .then((result) => {
        if (result && this.userId) {
          this.assignRole(result);
        }
      })
      .catch((reason) => {
        // Modal dismissed - do nothing
        console.log('Modal dismissed:', reason);
      });
  }

  assignRole(formData: { tenantId: string; roleId: string; isActive: boolean }): void {
    if (!this.userId) {
      return;
    }

    const assignData: AssignRoleRequest = {
      userId: this.userId,
      tenantId: formData.tenantId,
      roleId: formData.roleId,
      isActive: formData.isActive
    };

    this.userService.assignRole(assignData).subscribe({
      next: () => {
        if (this.userId) {
          this.loadUser(this.userId);
        }
      },
      error: (error) => {
        console.error('Error assigning role:', error);
        alert('Error assigning role');
      }
    });
  }

  removeRole(tenantId: string): void {
    if (!this.userId || !confirm('Are you sure you want to remove this role?')) {
      return;
    }

    this.userService.removeRole(this.userId, tenantId).subscribe({
      next: () => {
        if (this.userId) {
          this.loadUser(this.userId);
        }
      },
      error: (error) => {
        console.error('Error removing role:', error);
        alert('Error removing role');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }

  get availableTenants(): any[] {
    // SuperAdmin sees all tenants, Admin only their tenant
    const tenants = this.authService.getUserTenants();
    return tenants || [];
  }

  get canManageRoles(): boolean {
    return this.currentUserRole === UserRole.SUPER_ADMIN;
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
    }
    return '';
  }
}
