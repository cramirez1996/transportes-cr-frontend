import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { Customer } from '../../../../core/models/business/customer.model';
import { ModalService } from '../../../../core/services/modal.service';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customer-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  customers = signal<Customer[]>([]);
  loading = signal(false);

  private customerService = inject(CustomerService);
  private modalService = inject(ModalService);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const modalRef = this.modalService.open(CustomerFormComponent, {
      title: 'Nuevo Cliente'
    });

    modalRef.result
      .then((customerData) => {
        this.customerService.createCustomer(customerData).subscribe({
          next: () => this.loadCustomers(),
          error: (err) => console.error('Error creating customer:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  openEditModal(customer: Customer): void {
    const modalRef = this.modalService.open(CustomerFormComponent, {
      title: 'Editar Cliente',
      data: { customer }
    });

    modalRef.result
      .then((customerData) => {
        this.customerService.updateCustomer(customer.id, customerData).subscribe({
          next: () => this.loadCustomers(),
          error: (err) => console.error('Error updating customer:', err)
        });
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  deleteCustomer(id: string): void {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (err) => console.error('Error deleting customer:', err)
      });
    }
  }
}
