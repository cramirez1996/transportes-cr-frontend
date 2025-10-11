import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionListComponent } from './transaction-list/transaction-list.component';
import { TransactionFormComponent } from './transaction-form/transaction-form.component';
import { CategoryManagementComponent } from './category-management/category-management.component';

const routes: Routes = [
  {
    path: '',
    component: TransactionListComponent
  },
  {
    path: 'new',
    component: TransactionFormComponent
  },
  {
    path: 'categories',
    component: CategoryManagementComponent
  },
  {
    path: ':id/edit',
    component: TransactionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionsRoutingModule { }
