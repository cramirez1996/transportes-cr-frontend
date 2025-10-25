import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { ModalService } from '../../../../core/services/modal.service';
import { User, Role, CreateUserRequest, UpdateUserRequest, AssignRoleRequest, UserStatus } from '../../../../core/models/user.model';
import { Tenant } from '../../../../core/models/auth.model';
import { UserRole } from '../../../../core/models/enums/user-role.enum';
import { AssignRoleModalComponent, AssignRoleModalData } from '../assign-role-modal/assign-role-modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CustomSelectComponent],
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
  tenants: Tenant[] = [];
  currentUserRole: UserRole | null = null;
  currentTenantId: string | null = null;
  userTenants: any[] = [];
  isSubmitting = false;

  // Enums for template
  UserStatus = UserStatus;

  // Options for custom-select
  roleOptions: CustomSelectOption[] = [];
  tenantOptions: CustomSelectOption[] = [];
  statusOptions: CustomSelectOption[] = [
    { value: UserStatus.ACTIVE, label: 'Activo' },
    { value: UserStatus.INACTIVE, label: 'Inactivo' },
    { value: UserStatus.SUSPENDED, label: 'Suspendido' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private tenantService: TenantService,
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
      status: [UserStatus.ACTIVE, Validators.required],
      tenantId: [''], // Only for creation, not edit
      roleId: [''] // Initial role assignment
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
      // For create mode, set password and role as required
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);

      // Set validators based on user role
      if (this.isSuperAdmin) {
        // Super Admin must select tenant and role
        this.userForm.get('tenantId')?.setValidators([Validators.required]);
        this.userForm.get('roleId')?.setValidators([Validators.required]);
      } else if (this.isAdmin) {
        // Admin creates users in their tenant with role selection
        this.userForm.patchValue({ tenantId: this.currentTenantId });
        this.userForm.get('roleId')?.setValidators([Validators.required]);
      }
    }

    this.loadRoles();
    this.loadTenants();
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
        this.roleOptions = roles.map(role => ({
          value: role.id,
          label: role.displayName || role.name,
          data: { description: role.description }
        }));
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  loadTenants(): void {
    // Super Admin can see all tenants, Admin only sees their own
    if (this.isSuperAdmin) {
      this.tenantService.getAllTenants().subscribe({
        next: (tenants) => {
          this.tenants = tenants;
          this.tenantOptions = tenants.map(tenant => ({
            value: tenant.id,
            label: tenant.businessName || tenant.tradeName || 'Sin nombre',
            data: {
              rut: tenant.rut,
              tradeName: tenant.tradeName,
              avatar: this.getInitials(tenant.businessName || tenant.tradeName || '')
            }
          }));
        },
        error: (error) => {
          console.error('Error loading tenants:', error);
        }
      });
    } else if (this.isAdmin && this.currentTenantId) {
      // For Admin, load only their tenant
      this.tenantService.getTenantById(this.currentTenantId).subscribe({
        next: (tenant) => {
          this.tenants = [tenant];
          this.tenantOptions = [{
            value: tenant.id,
            label: tenant.businessName || tenant.tradeName || 'Sin nombre',
            data: {
              rut: tenant.rut,
              tradeName: tenant.tradeName,
              avatar: this.getInitials(tenant.businessName || tenant.tradeName || '')
            }
          }];
        },
        error: (error) => {
          console.error('Error loading tenant:', error);
        }
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
          console.error('Error al actualizar usuario:', error);
          alert(error.error?.message || 'Error al actualizar usuario');
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
        status: this.userForm.value.status,
        tenantId: this.userForm.value.tenantId || this.currentTenantId,
        roleId: this.userForm.value.roleId
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert(error.error?.message || 'Error al crear usuario');
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
    if (!this.userId || !confirm('¿Está seguro de eliminar este rol?')) {
      return;
    }

    this.userService.removeRole(this.userId, tenantId).subscribe({
      next: () => {
        if (this.userId) {
          this.loadUser(this.userId);
        }
      },
      error: (error) => {
        console.error('Error al eliminar rol:', error);
        alert('Error al eliminar rol');
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

  get isSuperAdmin(): boolean {
    return this.currentUserRole === UserRole.SUPER_ADMIN;
  }

  get isAdmin(): boolean {
    return this.currentUserRole === UserRole.ADMIN;
  }

  get showTenantField(): boolean {
    // Super Admin can select tenant in creation mode
    return this.isSuperAdmin && !this.isEditMode;
  }

  get showRoleField(): boolean {
    // Both Super Admin and Admin can assign roles during creation
    return !this.isEditMode && (this.isSuperAdmin || this.isAdmin);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['email']) return 'Formato de email inválido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}
