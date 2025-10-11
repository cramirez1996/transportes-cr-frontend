import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { redirectIfAuthenticatedGuard } from './core/guards/redirect-if-authenticated.guard';
import { UserRole } from './core/models/enums/user-role.enum';
import { LoginComponent } from './features/auth/login/login.component';
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
    path: 'login',
    component: LoginComponent,
    canActivate: [redirectIfAuthenticatedGuard]
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
        path: 'invoices',
        loadChildren: () => import('./features/admin/invoicing/invoicing-routing.module')
          .then(m => m.InvoicingRoutingModule)
      },
      {
        path: 'accounting',
        loadComponent: () => import('./features/admin/accounting/transaction-list/transaction-list.component')
          .then(m => m.TransactionListComponent)
      },
      {
        path: 'accounting/new',
        loadComponent: () => import('./features/admin/accounting/transaction-form/transaction-form.component')
          .then(m => m.TransactionFormComponent)
      },
      {
        path: 'accounting/edit/:id',
        loadComponent: () => import('./features/admin/accounting/transaction-form/transaction-form.component')
          .then(m => m.TransactionFormComponent)
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
