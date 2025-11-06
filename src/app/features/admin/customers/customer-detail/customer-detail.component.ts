import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { TripService } from '../../../../core/services/trip.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Customer, CustomerStatus } from '../../../../core/models/business/customer.model';
import { Trip, TripStatus } from '../../../../core/models/trip.model';
import { Invoice } from '../../../../core/models/invoice.model';
import { Transaction } from '../../../../core/models/transaction.model';
import { TabsComponent, Tab } from '../../../../shared/components/tabs/tabs.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PaginationParams } from '../../../../core/models/pagination.model';
import { DateOnlyPipe } from '../../../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TabsComponent, PaginationComponent, DateOnlyPipe],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss'
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private tripService = inject(TripService);
  private invoiceService = inject(InvoiceService);
  private transactionService = inject(TransactionService);

  customer: Customer | null = null;
  trips: Trip[] = [];
  invoices: Invoice[] = [];
  transactions: Transaction[] = [];
  loading = false;
  loadingTrips = false;
  loadingInvoices = false;
  loadingTransactions = false;

  // Pagination for trips
  tripsPage = 1;
  tripsLimit = 10;
  tripsTotal = 0;
  tripsTotalPages = 0;

  // Pagination for invoices
  invoicesPage = 1;
  invoicesLimit = 10;
  invoicesTotal = 0;
  invoicesTotalPages = 0;

  // Pagination for transactions
  transactionsPage = 1;
  transactionsLimit = 10;
  transactionsTotal = 0;
  transactionsTotalPages = 0;

  // Tabs configuration
  activeTab = 'trips';
  tabs: Tab[] = [
    { id: 'trips', label: 'Viajes', count: 0 },
    { id: 'invoices', label: 'Facturas', count: 0 },
    { id: 'documents', label: 'Documentos', count: 0 },
    { id: 'transactions', label: 'Transacciones', count: 0 }
  ];

  // Status configuration
  statusLabels = {
    [CustomerStatus.ACTIVE]: 'Activo',
    [CustomerStatus.INACTIVE]: 'Inactivo'
  };

  statusColors = {
    [CustomerStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [CustomerStatus.INACTIVE]: 'bg-red-100 text-red-800'
  };

  tripStatusLabels = {
    [TripStatus.PENDING]: 'Pendiente',
    [TripStatus.IN_PROGRESS]: 'En Curso',
    [TripStatus.COMPLETED]: 'Completado',
    [TripStatus.CANCELLED]: 'Cancelado'
  };

  tripStatusColors = {
    [TripStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TripStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TripStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };

  ngOnInit(): void {
    this.loadCustomerDetail();
  }

  loadCustomerDetail(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (!customerId) {
      alert('ID de cliente no válido');
      this.router.navigate(['/admin/customers']);
      return;
    }

    this.loading = true;
    this.customerService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.loading = false;
        this.loadCustomerTrips(customerId);
      },
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        alert('Error al cargar el detalle del cliente');
        this.loading = false;
      }
    });
  }

  loadCustomerTrips(customerId: string): void {
    this.loadingTrips = true;
    const pagination: PaginationParams = {
      page: this.tripsPage,
      limit: this.tripsLimit
    };
    
    this.tripService.getTripsByCustomer(customerId, pagination).subscribe({
      next: (response) => {
        this.trips = response.data;
        this.tripsTotal = response.total;
        this.tripsPage = response.page;
        this.tripsLimit = response.limit;
        this.tripsTotalPages = response.totalPages;
        this.updateTabCounts();
        this.loadingTrips = false;
      },
      error: (err) => {
        console.error('Error al cargar viajes:', err);
        this.loadingTrips = false;
      }
    });
  }

  loadCustomerInvoices(customerId: string): void {
    this.loadingInvoices = true;
    const pagination: PaginationParams = {
      page: this.invoicesPage,
      limit: this.invoicesLimit
    };
    
    this.invoiceService.getInvoices({ customerId }, pagination).subscribe({
      next: (response) => {
        this.invoices = response.data;
        this.invoicesTotal = response.total;
        this.invoicesPage = response.page;
        this.invoicesLimit = response.limit;
        this.invoicesTotalPages = response.totalPages;
        this.updateTabCounts();
        this.loadingInvoices = false;
      },
      error: (err) => {
        console.error('Error al cargar facturas:', err);
        this.loadingInvoices = false;
      }
    });
  }

  loadCustomerTransactions(customerId: string): void {
    this.loadingTransactions = true;
    const pagination: PaginationParams = {
      page: this.transactionsPage,
      limit: this.transactionsLimit
    };
    
    this.transactionService.getTransactions({ customerId }, pagination).subscribe({
      next: (response) => {
        this.transactions = response.data;
        this.transactionsTotal = response.total;
        this.transactionsPage = response.page;
        this.transactionsLimit = response.limit;
        this.transactionsTotalPages = response.totalPages;
        this.updateTabCounts();
        this.loadingTransactions = false;
      },
      error: (err) => {
        console.error('Error al cargar transacciones:', err);
        this.loadingTransactions = false;
      }
    });
  }

  updateTabCounts(): void {
    const tripsTab = this.tabs.find(t => t.id === 'trips');
    if (tripsTab) {
      tripsTab.count = this.tripsTotal;
    }
    const invoicesTab = this.tabs.find(t => t.id === 'invoices');
    if (invoicesTab) {
      invoicesTab.count = this.invoicesTotal;
    }
    const transactionsTab = this.tabs.find(t => t.id === 'transactions');
    if (transactionsTab) {
      transactionsTab.count = this.transactionsTotal;
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    if (!this.customer) return;

    // Load data for the selected tab if not already loaded
    switch (tabId) {
      case 'trips':
        if (this.trips.length === 0) {
          this.loadCustomerTrips(this.customer.id);
        }
        break;
      case 'invoices':
        if (this.invoices.length === 0) {
          this.loadCustomerInvoices(this.customer.id);
        }
        break;
      case 'transactions':
        if (this.transactions.length === 0) {
          this.loadCustomerTransactions(this.customer.id);
        }
        break;
    }
  }

  // Pagination handlers for trips
  onTripsPageChange(page: number): void {
    this.tripsPage = page;
    if (this.customer) {
      this.loadCustomerTrips(this.customer.id);
    }
  }

  onTripsLimitChange(limit: number): void {
    this.tripsLimit = limit;
    this.tripsPage = 1;
    if (this.customer) {
      this.loadCustomerTrips(this.customer.id);
    }
  }

  // Pagination handlers for invoices
  onInvoicesPageChange(page: number): void {
    this.invoicesPage = page;
    if (this.customer) {
      this.loadCustomerInvoices(this.customer.id);
    }
  }

  onInvoicesLimitChange(limit: number): void {
    this.invoicesLimit = limit;
    this.invoicesPage = 1;
    if (this.customer) {
      this.loadCustomerInvoices(this.customer.id);
    }
  }

  // Pagination handlers for transactions
  onTransactionsPageChange(page: number): void {
    this.transactionsPage = page;
    if (this.customer) {
      this.loadCustomerTransactions(this.customer.id);
    }
  }

  onTransactionsLimitChange(limit: number): void {
    this.transactionsLimit = limit;
    this.transactionsPage = 1;
    if (this.customer) {
      this.loadCustomerTransactions(this.customer.id);
    }
  }

  // Drilldown navigation
  viewTripDetail(tripId: string): void {
    this.router.navigate(['/admin/trips', tripId]);
  }

  viewInvoiceDetail(invoiceId: string): void {
    this.router.navigate(['/admin/invoicing/invoices', invoiceId]);
  }

  viewTransactionDetail(transactionId: string): void {
    this.router.navigate(['/admin/accounting/transactions', transactionId]);
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  calculateTotalRevenue(): number {
    return this.trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .reduce((sum, trip) => sum + parseFloat(trip.agreedPrice), 0);
  }

  calculateTotalProfit(): number {
    return this.trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .reduce((sum, trip) => sum + (trip.profit || 0), 0);
  }

  getCompletedTripsCount(): number {
    return this.trips.filter(trip => trip.status === TripStatus.COMPLETED).length;
  }
}
