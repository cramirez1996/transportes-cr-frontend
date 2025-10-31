import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TransactionService } from '../../../../core/services/transaction.service';
import {
  Transaction,
  TransactionType,
  TransactionFilters,
  PaymentMethod,
  TransactionCategory,
} from '../../../../core/models/transaction.model';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { TripService } from '../../../../core/services/trip.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginationComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    CustomSelectComponent
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private customerService = inject(CustomerService);
  private supplierService = inject(SupplierService);
  private invoiceService = inject(InvoiceService);
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  transactions: Transaction[] = [];
  categories: TransactionCategory[] = [];
  isLoading = false;
  error: string | null = null;

  // Data for custom selects
  customerOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];
  invoiceOptions: CustomSelectOption[] = [];
  tripOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  driverOptions: CustomSelectOption[] = [];

  // Pagination
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  // Filtros
  filters: TransactionFilters = {
    sortBy: 'date',
    sortOrder: 'DESC'
  };
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Auxiliary properties for date inputs (format: yyyy-MM-dd)
  startDateInput: string = '';
  endDateInput: string = '';

  // UI State
  showAdvancedFilters = false;

  ngOnInit(): void {
    // Load all data in parallel
    forkJoin({
      categories: this.transactionService.getCategories(),
      customers: this.customerService.getCustomers(),
      suppliers: this.supplierService.getSuppliers(),
      invoices: this.invoiceService.getInvoices({}, { page: 1, limit: 1000 }),
      trips: this.tripService.getTrips({ page: 1, limit: 1000 }),
      vehicles: this.vehicleService.getVehicles(),
      drivers: this.driverService.getDrivers()
    }).subscribe({
      next: (data) => {
        this.categories = data.categories;

        // Build customer options
        this.customerOptions = data.customers
          .filter(c => c.status === 'ACTIVE')
          .map(c => ({
            value: c.id,
            label: c.businessName,
            data: {
              rut: c.rut,
              avatar: this.getInitials(c.businessName)
            }
          }));

        // Build supplier options
        this.supplierOptions = data.suppliers.map(s => ({
          value: s.id,
          label: s.businessName,
          data: {
            rut: s.rut,
            avatar: this.getInitials(s.businessName)
          }
        }));

        // Build invoice options
        this.invoiceOptions = data.invoices.data.map(inv => ({
          value: inv.id,
          label: `${inv.folioNumber} - $${this.formatCurrency(inv.totalAmount)}`,
          searchableText: `${inv.folioNumber} ${inv.customer?.businessName || ''} ${inv.supplier?.businessName || ''} ${inv.totalAmount}`,
          data: {
            type: inv.type,
            folioNumber: inv.folioNumber,
            totalAmount: inv.totalAmount,
            issueDate: inv.issueDate,
            customerName: inv.customer?.businessName,
            supplierName: inv.supplier?.businessName
          }
        }));

        // Build trip options
        this.tripOptions = data.trips.data.map(t => ({
          value: t.id,
          label: `${t.origin} → ${t.destination}`,
          searchableText: `${t.id} ${t.origin} ${t.destination}`,
          data: {
            id: t.id,
            origin: t.origin,
            destination: t.destination,
            departureDate: t.departureDate
          }
        }));

        // Build vehicle options
        this.vehicleOptions = data.vehicles
          .filter(v => v.status === 'available' || v.status === 'in_use')
          .map(v => ({
            value: v.id,
            label: v.licensePlate,
            data: {
              licensePlate: v.licensePlate,
              brand: v.brand,
              model: v.model
            }
          }));

        // Build driver options
        this.driverOptions = data.drivers
          .filter(d => d.status === 'active')
          .map(d => ({
            value: d.id,
            label: `${d.firstName} ${d.lastName}`,
            data: {
              licenseNumber: d.licenseNumber,
              avatar: this.getInitials(`${d.firstName} ${d.lastName}`)
            }
          }));
      },
      error: (error) => {
        console.error('Error loading data:', error);
      }
    });

    // Read query params
    this.route.queryParams.subscribe(params => {
      this.page = params['page'] ? +params['page'] : 1;
      this.limit = params['limit'] ? +params['limit'] : 10;
      this.filters.search = params['search'] || '';
      this.filters.type = params['type'] || undefined;
      this.filters.paymentMethod = params['paymentMethod'] || undefined;
      this.filters.categoryId = params['categoryId'] || undefined;
      this.filters.sortBy = params['sortBy'] || 'date';
      this.filters.sortOrder = params['sortOrder'] || 'DESC';

      if (params['startDate']) {
        this.filters.startDate = new Date(params['startDate']);
        this.startDateInput = params['startDate'];
      }
      if (params['endDate']) {
        this.filters.endDate = new Date(params['endDate']);
        this.endDateInput = params['endDate'];
      }
      if (params['minAmount']) {
        this.filters.minAmount = +params['minAmount'];
      }
      if (params['maxAmount']) {
        this.filters.maxAmount = +params['maxAmount'];
      }

      this.loadTransactions();
    });
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.error = null;

    this.transactionService.getTransactions(this.filters, { page: this.page, limit: this.limit }).subscribe({
      next: (response) => {
        this.transactions = response.data;
        this.total = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.error = 'Error al cargar las transacciones';
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    // Update date filters from input strings
    this.filters.startDate = this.startDateInput ? new Date(this.startDateInput) : undefined;
    this.filters.endDate = this.endDateInput ? new Date(this.endDateInput) : undefined;

    // Reset to page 1 when filters change
    this.page = 1;
    this.updateQueryParams();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.updateQueryParams();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1; // Reset to first page
    this.updateQueryParams();
  }

  updateQueryParams(): void {
    const queryParams: any = {
      page: this.page,
      limit: this.limit
    };

    if (this.filters.search) queryParams.search = this.filters.search;
    if (this.filters.type) queryParams.type = this.filters.type;
    if (this.filters.paymentMethod) queryParams.paymentMethod = this.filters.paymentMethod;
    if (this.filters.categoryId) queryParams.categoryId = this.filters.categoryId;
    if (this.filters.startDate) queryParams.startDate = this.startDateInput;
    if (this.filters.endDate) queryParams.endDate = this.endDateInput;
    if (this.filters.minAmount) queryParams.minAmount = this.filters.minAmount;
    if (this.filters.maxAmount) queryParams.maxAmount = this.filters.maxAmount;
    if (this.filters.customerId) queryParams.customerId = this.filters.customerId;
    if (this.filters.supplierId) queryParams.supplierId = this.filters.supplierId;
    if (this.filters.invoiceId) queryParams.invoiceId = this.filters.invoiceId;
    if (this.filters.tripId) queryParams.tripId = this.filters.tripId;
    if (this.filters.vehicleId) queryParams.vehicleId = this.filters.vehicleId;
    if (this.filters.driverId) queryParams.driverId = this.filters.driverId;
    if (this.filters.sortBy) queryParams.sortBy = this.filters.sortBy;
    if (this.filters.sortOrder) queryParams.sortOrder = this.filters.sortOrder;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.type) count++;
    if (this.filters.paymentMethod) count++;
    if (this.filters.categoryId) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.minAmount !== undefined) count++;
    if (this.filters.maxAmount !== undefined) count++;
    if (this.filters.customerId) count++;
    if (this.filters.supplierId) count++;
    if (this.filters.invoiceId) count++;
    if (this.filters.tripId) count++;
    if (this.filters.vehicleId) count++;
    if (this.filters.driverId) count++;
    return count;
  }

  clearFilters(): void {
    this.filters = {
      sortBy: 'date',
      sortOrder: 'DESC'
    };
    this.startDateInput = '';
    this.endDateInput = '';
    this.page = 1;
    this.updateQueryParams();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  deleteTransaction(id: string): void {
    if (confirm('¿Está seguro de eliminar esta transacción?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          alert('Error al eliminar la transacción');
        }
      });
    }
  }

  canDelete(transaction: Transaction): boolean {
    return true;
  }

  getTypeLabel(type: TransactionType): string {
    return type === TransactionType.INCOME ? 'Ingreso' : 'Gasto';
  }

  getTypeBadgeClass(type: TransactionType): string {
    return type === TransactionType.INCOME ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.TRANSFER]: 'Transferencia',
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.CHECK]: 'Cheque'
    };
    return labels[method];
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getTagsArray(tags: Record<string, any>): { key: string; value: string }[] {
    if (!tags || typeof tags !== 'object') return [];
    return Object.entries(tags).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

