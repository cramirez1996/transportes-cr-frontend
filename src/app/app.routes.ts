import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { redirectIfAuthenticatedGuard } from './core/guards/redirect-if-authenticated.guard';
import { UserRole } from './core/models/enums/user-role.enum';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { RedirectComponent } from './features/auth/redirect/redirect.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { CustomerLayoutComponent } from './layout/customer-layout/customer-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: RedirectComponent,
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [redirectIfAuthenticatedGuard]
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent
      }
    ]
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customers/customer-list/customer-list.component')
          .then(m => m.CustomerListComponent)
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./features/admin/customers/customer-detail/customer-detail.component')
          .then(m => m.CustomerDetailComponent)
      },
      {
        path: 'fleet',
        loadComponent: () => import('./features/admin/fleet/vehicle-list/vehicle-list.component')
          .then(m => m.VehicleListComponent)
      },
      {
        path: 'fleet/maintenance',
        loadComponent: () => import('./features/admin/fleet/maintenance-list/maintenance-list.component')
          .then(m => m.MaintenanceListComponent)
      },
      {
        path: 'fleet/maintenance/new',
        loadComponent: () => import('./features/admin/fleet/maintenance-form/maintenance-form.component')
          .then(m => m.MaintenanceFormComponent)
      },
      {
        path: 'fleet/maintenance/:id/edit',
        loadComponent: () => import('./features/admin/fleet/maintenance-form/maintenance-form.component')
          .then(m => m.MaintenanceFormComponent)
      },
      {
        path: 'fleet/maintenance/:id',
        loadComponent: () => import('./features/admin/fleet/maintenance-detail/maintenance-detail.component')
          .then(m => m.MaintenanceDetailComponent)
      },
      {
        path: 'fleet/maintenance-types',
        loadComponent: () => import('./features/admin/fleet/maintenance-types-list/maintenance-types-list.component')
          .then(m => m.MaintenanceTypesListComponent)
      },
      {
        path: 'fleet/maintenance-types/new',
        loadComponent: () => import('./features/admin/fleet/maintenance-types-form/maintenance-types-form.component')
          .then(m => m.MaintenanceTypesFormComponent)
      },
      {
        path: 'fleet/maintenance-types/:id/edit',
        loadComponent: () => import('./features/admin/fleet/maintenance-types-form/maintenance-types-form.component')
          .then(m => m.MaintenanceTypesFormComponent)
      },
      {
        path: 'fleet/vehicle-maintenance-plans',
        loadComponent: () => import('./features/admin/fleet/vehicle-maintenance-plans-list/vehicle-maintenance-plans-list.component')
          .then(m => m.VehicleMaintenancePlansListComponent)
      },
      {
        path: 'fleet/vehicle-maintenance-plans/new',
        loadComponent: () => import('./features/admin/fleet/vehicle-maintenance-plans-form/vehicle-maintenance-plans-form.component')
          .then(m => m.VehicleMaintenancePlansFormComponent)
      },
      {
        path: 'fleet/vehicle-maintenance-plans/:id/edit',
        loadComponent: () => import('./features/admin/fleet/vehicle-maintenance-plans-form/vehicle-maintenance-plans-form.component')
          .then(m => m.VehicleMaintenancePlansFormComponent)
      },
      {
        path: 'hr',
        loadComponent: () => import('./features/admin/hr/driver-list/driver-list.component')
          .then(m => m.DriverListComponent)
      },
      {
        path: 'trips',
        loadComponent: () => import('./features/admin/trips/trip-list/trip-list.component')
          .then(m => m.TripListComponent)
      },
      {
        path: 'trips/:id',
        loadComponent: () => import('./features/admin/trips/trip-detail/trip-detail.component')
          .then(m => m.TripDetailComponent)
      },
      {
        path: 'trip-groups',
        loadComponent: () => import('./features/admin/trip-groups/trip-group-list/trip-group-list.component')
          .then(m => m.TripGroupListComponent)
      },
      {
        path: 'trip-groups/new',
        loadComponent: () => import('./features/admin/trip-groups/trip-group-form/trip-group-form.component')
          .then(m => m.TripGroupFormComponent)
      },
      {
        path: 'trip-groups/:id',
        loadComponent: () => import('./features/admin/trip-groups/trip-group-detail/trip-group-detail.component')
          .then(m => m.TripGroupDetailComponent)
      },
      {
        path: 'trip-groups/:id/edit',
        loadComponent: () => import('./features/admin/trip-groups/trip-group-form/trip-group-form.component')
          .then(m => m.TripGroupFormComponent)
      },
      {
        path: 'invoicing',
        loadChildren: () => import('./features/admin/invoicing/invoicing-routing.module')
          .then(m => m.InvoicingRoutingModule)
      },
      {
        path: 'accounting',
        loadComponent: () => import('./features/admin/accounting/transaction-list/transaction-list.component')
          .then(m => m.TransactionListComponent)
      },
      {
        path: 'accounting/transactions',
        loadComponent: () => import('./features/admin/accounting/transaction-list/transaction-list.component')
          .then(m => m.TransactionListComponent)
      },
      {
        path: 'accounting/transaction-explorer',
        loadComponent: () => import('./features/admin/accounting/transaction-explorer/transaction-explorer.component')
          .then(m => m.TransactionExplorerComponent)
      },
      {
        path: 'accounting/categories',
        loadComponent: () => import('./features/admin/accounting/category-management/category-management.component')
          .then(m => m.CategoryManagementComponent)
      },
      {
        path: 'accounting/new',
        loadComponent: () => import('./features/admin/accounting/transaction-form/transaction-form.component')
          .then(m => m.TransactionFormComponent)
      },
      {
        path: 'accounting/:id',
        loadComponent: () => import('./features/admin/accounting/transaction-detail/transaction-detail.component')
          .then(m => m.TransactionDetailComponent)
      },
      {
        path: 'accounting/edit/:id',
        loadComponent: () => import('./features/admin/accounting/transaction-form/transaction-form.component')
          .then(m => m.TransactionFormComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/admin/suppliers/supplier-list/supplier-list.component')
          .then(m => m.SupplierListComponent)
      },
      {
        path: 'suppliers/:id',
        loadComponent: () => import('./features/admin/suppliers/supplier-detail/supplier-detail.component')
          .then(m => m.SupplierDetailComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/admin/users/user-form/user-form.component')
          .then(m => m.UserFormComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/admin/users/user-form/user-form.component')
          .then(m => m.UserFormComponent)
      },
      {
        path: 'users/:id/edit',
        loadComponent: () => import('./features/admin/users/user-form/user-form.component')
          .then(m => m.UserFormComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/admin/roles/role-list/role-list.component')
          .then(m => m.RoleListComponent)
      },
      {
        path: 'roles/new',
        loadComponent: () => import('./features/admin/roles/role-form/role-form.component')
          .then(m => m.RoleFormComponent)
      },
      {
        path: 'roles/:id',
        loadComponent: () => import('./features/admin/roles/role-detail/role-detail.component')
          .then(m => m.RoleDetailComponent)
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () => import('./features/admin/roles/role-form/role-form.component')
          .then(m => m.RoleFormComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/reports-dashboard/reports-dashboard.component')
          .then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/trip-profitability',
        loadComponent: () => import('./features/admin/reports/trip-profitability-report/trip-profitability-report.component')
          .then(m => m.TripProfitabilityReportComponent)
      },
      {
        path: 'reports/financial',
        loadComponent: () => import('./features/admin/reports/financial-report/financial-report.component')
          .then(m => m.FinancialReportComponent)
      },
      {
        path: 'reports/expenses',
        loadComponent: () => import('./features/admin/reports/expenses-report/expenses-report.component')
          .then(m => m.ExpensesReportComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/admin/documents/document-list/document-list.component')
          .then(m => m.DocumentListComponent)
      },
      {
        path: 'documents/:id',
        loadComponent: () => import('./features/admin/documents/document-detail/document-detail.component')
          .then(m => m.DocumentDetailComponent)
      },
      {
        path: 'custom-select-demo',
        loadComponent: () => import('./features/admin/custom-select-demo/custom-select-demo.component')
          .then(m => m.CustomSelectDemoComponent)
      }
    ]
  },
  {
    path: 'portal',
    component: CustomerLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.CUSTOMER] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer-portal/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
