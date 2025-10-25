import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice, InvoiceType, InvoiceStatus, InvoiceFilters, SII_DOCUMENT_TYPES } from '../../../../core/models/invoice.model';
import { PaginationParams } from '../../../../core/models/pagination.model';
import { UploadXmlModalComponent } from '../upload-xml-modal/upload-xml-modal.component';
import { ChangeStatusModalComponent } from '../change-status-modal/change-status-modal.component';
import { EditFieldsModalComponent } from '../edit-fields-modal/edit-fields-modal.component';
import { InvoiceDocumentsModalComponent } from '../invoice-documents-modal/invoice-documents-modal.component';
import { PaymentMethod } from '../../../../core/models/transaction.model';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';
import { ModalService } from '../../../../core/services/modal.service';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { TripService } from '../../../../core/services/trip.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, CustomSelectComponent, UploadXmlModalComponent, ChangeStatusModalComponent, EditFieldsModalComponent],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private supplierService = inject(SupplierService);
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private modalService = inject(ModalService);

  @ViewChild(UploadXmlModalComponent) uploadXmlModal!: UploadXmlModalComponent;
  @ViewChild(ChangeStatusModalComponent) changeStatusModal!: ChangeStatusModalComponent;
  @ViewChild(EditFieldsModalComponent) editFieldsModal!: EditFieldsModalComponent;

  currentInvoice: Invoice | null = null;

  invoices: Invoice[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  page: number = 1;
  limit: number = 10;
  total: number = 0;
  totalPages: number = 0;

  // Filtros
  filters: InvoiceFilters = {
    sortBy: 'issueDate',
    sortOrder: 'DESC'
  };
  InvoiceType = InvoiceType;
  InvoiceStatus = InvoiceStatus;
  SiiDocumentTypes = SII_DOCUMENT_TYPES;

  // Auxiliary properties for date inputs (format: yyyy-MM-dd)
  startDateInput: string = '';
  endDateInput: string = '';
  accountingPeriodStartInput: string = '';
  accountingPeriodEndInput: string = '';

  // Advanced filters toggle
  showAdvancedFilters = false;

  // Options for custom-select components
  customerOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];
  tripOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];

  // Active filters count
  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.type) count++;
    if (this.filters.status) count++;
    if (this.filters.documentType) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.customerId) count++;
    if (this.filters.supplierId) count++;
    if (this.filters.folioNumber) count++;
    if (this.filters.minAmount !== undefined && this.filters.minAmount !== null) count++;
    if (this.filters.maxAmount !== undefined && this.filters.maxAmount !== null) count++;
    if (this.filters.tripId) count++;
    if (this.filters.vehicleId) count++;
    if (this.filters.accountingPeriodStart) count++;
    if (this.filters.accountingPeriodEnd) count++;
    if (this.filters.search) count++;
    return count;
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadCustomers();
    this.loadSuppliers();
    this.loadTrips();
    this.loadVehicles();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customerOptions = customers.map(c => ({
          value: c.id,
          label: c.businessName,
          data: {
            rut: c.rut,
            avatar: this.getInitials(c.businessName)
          }
        }));
      },
      error: (err) => console.error('Error loading customers:', err)
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.supplierOptions = suppliers.map(s => ({
          value: s.id,
          label: s.businessName,
          data: {
            rut: s.rut,
            avatar: this.getInitials(s.businessName)
          }
        }));
      },
      error: (err) => console.error('Error loading suppliers:', err)
    });
  }

  loadTrips(): void {
    // Load trips for custom-select (high limit for dropdown)
    this.tripService.getTrips({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.tripOptions = response.data.map(t => ({
          value: t.id,
          label: `${t.origin} → ${t.destination}`,
          searchableText: `${t.id} ${t.origin} ${t.destination}`, // Include ID in search
          data: {
            id: t.id,
            origin: t.origin,
            destination: t.destination,
            departureDate: t.departureDate
          }
        }));
      },
      error: (err) => console.error('Error loading trips:', err)
    });
  }

  loadVehicles(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicleOptions = vehicles.map(v => ({
          value: v.id,
          label: v.licensePlate,
          data: {
            brand: v.brand,
            model: v.model,
            type: v.type
          }
        }));
      },
      error: (err) => console.error('Error loading vehicles:', err)
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;

    const pagination: PaginationParams = {
      page: this.page,
      limit: this.limit
    };

    this.invoiceService.getInvoices(this.filters, pagination).subscribe({
      next: (response) => {
        this.invoices = response.data;
        this.total = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las facturas';
        console.error(err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    // Convert date input strings to Date objects for filters
    if (this.startDateInput) {
      this.filters.startDate = new Date(this.startDateInput);
    } else {
      this.filters.startDate = undefined;
    }

    if (this.endDateInput) {
      this.filters.endDate = new Date(this.endDateInput);
    } else {
      this.filters.endDate = undefined;
    }

    if (this.accountingPeriodStartInput) {
      this.filters.accountingPeriodStart = new Date(this.accountingPeriodStartInput);
    } else {
      this.filters.accountingPeriodStart = undefined;
    }

    if (this.accountingPeriodEndInput) {
      this.filters.accountingPeriodEnd = new Date(this.accountingPeriodEndInput);
    } else {
      this.filters.accountingPeriodEnd = undefined;
    }

    // Reset pagination when filters change
    this.page = 1;
    this.loadInvoices();
  }

  clearFilters(): void {
    this.filters = {};
    this.startDateInput = '';
    this.endDateInput = '';
    this.accountingPeriodStartInput = '';
    this.accountingPeriodEndInput = '';
    this.page = 1;
    this.loadInvoices();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  openChangeStatusModal(invoice: Invoice, newStatus: InvoiceStatus): void {
    this.currentInvoice = invoice;
    // Convert Date to string format for the date input (YYYY-MM-DD)
    const accountingPeriodStr = invoice.accountingPeriod
      ? new Date(invoice.accountingPeriod).toISOString().split('T')[0]
      : undefined;
    this.changeStatusModal.open(invoice.type, invoice.status, newStatus, accountingPeriodStr, invoice.items);
  }

  onStatusChanged(data: {
    status: InvoiceStatus;
    categoryId?: string;
    itemCategories?: Array<{ invoiceItemId: string; categoryId: string }>;
    paymentMethod?: PaymentMethod;
    accountingPeriod?: string;
  }): void {
    if (!this.currentInvoice) {
      return;
    }

    this.invoiceService.changeInvoiceStatus(
      this.currentInvoice.id,
      data.status,
      {
        categoryId: data.categoryId,
        itemCategories: data.itemCategories,
        paymentMethod: data.paymentMethod,
        accountingPeriod: data.accountingPeriod
      }
    ).subscribe({
      next: () => {
        this.loadInvoices();
        this.currentInvoice = null;
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        const errorMessage = err.error?.message || 'Error al cambiar el estado de la factura';
        alert(errorMessage);
        this.currentInvoice = null;
      }
    });
  }

  openEditFieldsModal(invoice: Invoice): void {
    this.currentInvoice = invoice;
    this.editFieldsModal.open(invoice.id, invoice.folioNumber, invoice.accountingPeriod as any, invoice.notes);
  }

  onFieldsUpdated(data: { accountingPeriod: string; notes?: string }): void {
    if (!this.currentInvoice) {
      return;
    }

    this.invoiceService.updateInvoiceFields(
      this.currentInvoice.id,
      {
        accountingPeriod: data.accountingPeriod,
        notes: data.notes
      }
    ).subscribe({
      next: () => {
        this.loadInvoices();
        this.currentInvoice = null;
      },
      error: (err) => {
        console.error('Error al actualizar campos:', err);
        const errorMessage = err.error?.message || 'Error al actualizar los campos de la factura';
        alert(errorMessage);
        this.currentInvoice = null;
      }
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (invoice.status !== InvoiceStatus.DRAFT) {
      alert('Solo se pueden eliminar facturas en estado borrador');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar la factura ${invoice.folioNumber}?`)) {
      this.invoiceService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar la factura');
        }
      });
    }
  }

  get paginatedInvoices(): Invoice[] {
    return this.invoices;
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadInvoices();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadInvoices();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.loadInvoices();
    }
  }

  changePageSize(newSize: number): void {
    this.limit = newSize;
    this.page = 1;
    this.loadInvoices();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push(-1); // Ellipsis
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push(-1); // Ellipsis
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  }

  // Expose Math for template
  Math = Math;

  getStatusLabel(status: InvoiceStatus): string {
    const labels = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Anulada',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'Creditada Parcial',
      [InvoiceStatus.FULLY_CREDITED]: 'Creditada Total'
    };
    return labels[status];
  }

  getStatusClass(status: InvoiceStatus): string {
    const classes = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'bg-yellow-100 text-yellow-800',
      [InvoiceStatus.FULLY_CREDITED]: 'bg-orange-100 text-orange-800'
    };
    return classes[status];
  }

  getTypeLabel(type: InvoiceType): string {
    return type === InvoiceType.SALE ? 'Venta' : 'Compra';
  }

  openUploadXmlModal(): void {
    this.uploadXmlModal.open();
  }

  openDocumentsModal(invoice: Invoice): void {
    const modalRef = this.modalService.open(InvoiceDocumentsModalComponent, {
      title: 'Documentos de Factura',
      data: {
        invoiceId: invoice.id,
        invoiceFolio: invoice.folioNumber
      }
    });

    modalRef.result
      .then(() => {
        // Modal closed successfully, reload invoices if needed
        this.loadInvoices();
      })
      .catch(() => {
        // Modal dismissed, no action needed
      });
  }
}
