import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceListComponent } from './invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './invoice-form/invoice-form.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';
import { BulkUploadXmlComponent } from './bulk-upload-xml/bulk-upload-xml.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceListComponent
  },
  {
    path: 'new',
    component: InvoiceFormComponent
  },
  {
    path: 'bulk-upload',
    component: BulkUploadXmlComponent
  },
  {
    path: ':id',
    component: InvoiceDetailComponent
  },
  {
    path: ':id/edit',
    component: InvoiceFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvoicingRoutingModule { }
