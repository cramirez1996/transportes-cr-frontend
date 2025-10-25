import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { Customer, CustomerStatus } from '../../../../core/models/business/customer.model';
import { ModalService } from '../../../../core/services/modal.service';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';

interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  city?: string;
  minTrips?: number;
}

@Component({
  selector: 'app-customer-list',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    AvatarComponent
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Expose enum to template
  CustomerStatus = CustomerStatus;

  // Filters
  filters: CustomerFilters = {};

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  private customerService = inject(CustomerService);
  private modalService = inject(ModalService);

  // Computed: Filtered customers
  filteredCustomers = computed(() => {
    let result = this.customers();

    // Search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      result = result.filter(customer =>
        customer.rut?.toLowerCase().includes(searchLower) ||
        customer.businessName?.toLowerCase().includes(searchLower) ||
        customer.contactName?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.filters.status) {
      result = result.filter(customer => customer.status === this.filters.status);
    }

    // City filter
    if (this.filters.city) {
      const cityLower = this.filters.city.toLowerCase();
      result = result.filter(customer => customer.city?.toLowerCase().includes(cityLower));
    }

    // Min trips filter
    if (this.filters.minTrips !== undefined && this.filters.minTrips !== null) {
      result = result.filter(customer => (customer.totalTrips || 0) >= this.filters.minTrips!);
    }

    return result;
  });

  // Computed: Paginated customers
  paginatedCustomers = computed(() => {
    const filtered = this.filteredCustomers();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  // Computed: Total pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredCustomers().length / this.itemsPerPage);
  });

  // Computed: Active filters count
  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status) count++;
    if (this.filters.city) count++;
    if (this.filters.minTrips !== undefined && this.filters.minTrips !== null) count++;
    return count;
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.error.set('Error al cargar los clientes. Por favor, intente nuevamente.');
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

  toggleCustomerStatus(customer: Customer): void {
    const newStatus = customer.status === CustomerStatus.ACTIVE ? CustomerStatus.INACTIVE : CustomerStatus.ACTIVE;
    const action = newStatus === CustomerStatus.ACTIVE ? 'activar' : 'desactivar';

    if (confirm(`¿Estás seguro de ${action} este cliente?`)) {
      this.customerService.updateCustomer(customer.id, { status: newStatus }).subscribe({
        next: () => {
          this.loadCustomers();
        },
        error: (err) => console.error('Error updating customer status:', err)
      });
    }
  }

  // Filter methods
  onFilterChange(): void {
    // Reset to first page when filters change
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filters = {};
    this.currentPage.set(1);
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}
