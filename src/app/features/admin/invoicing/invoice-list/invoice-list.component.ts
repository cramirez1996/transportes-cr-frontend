import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
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
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalService } from '../../../../core/services/modal.service';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { TripService } from '../../../../core/services/trip.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DateOnlyPipe } from '../../../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, CustomSelectComponent, PaginationComponent, UploadXmlModalComponent, ChangeStatusModalComponent, EditFieldsModalComponent, DateOnlyPipe],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private supplierService = inject(SupplierService);
  private tripService = inject(TripService);
  private vehicleService = inject(VehicleService);
  private modalService = inject(ModalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

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

  // Form
  filterForm!: FormGroup;

  // Enums
  InvoiceType = InvoiceType;
  InvoiceStatus = InvoiceStatus;
  SiiDocumentTypes = SII_DOCUMENT_TYPES;

  // Advanced filters toggle
  showAdvancedFilters = false;

  // Options for custom-select components
  customerOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];
  tripOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];

  // Getters for template binding compatibility
  get filters() {
    return this.filterForm?.value || {};
  }

  set filters(value: any) {
    if (this.filterForm) {
      this.filterForm.patchValue(value, { emitEvent: false });
    }
  }

  // Date input getters/setters for template compatibility
  get startDateInput(): string {
    return this.filterForm?.get('startDate')?.value || '';
  }

  set startDateInput(value: string) {
    this.filterForm?.patchValue({ startDate: value });
  }

  get endDateInput(): string {
    return this.filterForm?.get('endDate')?.value || '';
  }

  set endDateInput(value: string) {
    this.filterForm?.patchValue({ endDate: value });
  }

  get accountingPeriodStartInput(): string {
    return this.filterForm?.get('accountingPeriodStart')?.value || '';
  }

  set accountingPeriodStartInput(value: string) {
    this.filterForm?.patchValue({ accountingPeriodStart: value });
  }

  get accountingPeriodEndInput(): string {
    return this.filterForm?.get('accountingPeriodEnd')?.value || '';
  }

  set accountingPeriodEndInput(value: string) {
    this.filterForm?.patchValue({ accountingPeriodEnd: value });
  }

  // Active filters count
  get activeFiltersCount(): number {
    if (!this.filterForm) return 0;
    const values = this.filterForm.value;
    return Object.keys(values).filter(key => {
      const value = values[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
  }

  ngOnInit(): void {
    this.initializeForm();
    // First load options, then subscribe to query params
    this.loadSelectOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      // Basic filters
      type: [null],
      status: [null],
      documentType: [null],
      startDate: [null],
      endDate: [null],
      search: [null],
      
      // Advanced filters
      customerId: [null],
      supplierId: [null],
      folioNumber: [null],
      minAmount: [null],
      maxAmount: [null],
      tripId: [null],
      vehicleId: [null],
      accountingPeriodStart: [null],
      accountingPeriodEnd: [null],
      
      // Sorting
      sortBy: ['issueDate'],
      sortOrder: ['DESC']
    });
  }

  private loadSelectOptions(): void {
    combineLatest([
      this.customerService.getCustomers(),
      this.supplierService.getSuppliers(),
      this.tripService.getTrips({ page: 1, limit: 1000 }),
      this.vehicleService.getVehicles()
    ]).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([customers, suppliers, tripsResponse, vehicles]) => {
          this.customerOptions = this.mapToSelectOptions(customers, (c) => ({
            value: c.id,
            label: c.businessName,
            data: { rut: c.rut, avatar: this.getInitials(c.businessName) }
          }));

          this.supplierOptions = this.mapToSelectOptions(suppliers, (s) => ({
            value: s.id,
            label: s.businessName,
            data: { rut: s.rut, avatar: this.getInitials(s.businessName) }
          }));

          this.tripOptions = tripsResponse.data.map(t => ({
            value: t.id,
            label: `${t.origin} → ${t.destination}`,
            searchableText: `${t.id} ${t.origin} ${t.destination}`,
            data: { id: t.id, origin: t.origin, destination: t.destination, departureDate: t.departureDate }
          }));

          this.vehicleOptions = this.mapToSelectOptions(vehicles, (v) => ({
            value: v.id,
            label: v.licensePlate,
            data: { brand: v.brand, model: v.model, type: v.type }
          }));

          // After options are loaded, subscribe to query params and form changes
          this.subscribeToQueryParams();
          this.subscribeToFormChanges();
        },
        error: (err) => console.error('Error loading select options:', err)
      });
  }

  private mapToSelectOptions<T>(items: T[], mapper: (item: T) => CustomSelectOption): CustomSelectOption[] {
    return items.map(mapper);
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Pagination
        this.page = params['page'] ? Number(params['page']) : 1;
        this.limit = params['limit'] ? Number(params['limit']) : 10;

        // Update form with query params (without emitting to avoid loop)
        this.filterForm.patchValue({
          type: params['type'] || null,
          status: params['status'] || null,
          documentType: params['documentType'] ? Number(params['documentType']) : null,
          startDate: params['startDate'] || null,
          endDate: params['endDate'] || null,
          customerId: params['customerId'] || null,
          supplierId: params['supplierId'] || null,
          folioNumber: params['folioNumber'] || null,
          minAmount: params['minAmount'] ? Number(params['minAmount']) : null,
          maxAmount: params['maxAmount'] ? Number(params['maxAmount']) : null,
          tripId: params['tripId'] || null,
          vehicleId: params['vehicleId'] || null,
          accountingPeriodStart: params['accountingPeriodStart'] || null,
          accountingPeriodEnd: params['accountingPeriodEnd'] || null,
          search: params['search'] || null,
          sortBy: params['sortBy'] || 'issueDate',
          sortOrder: params['sortOrder'] || 'DESC'
        }, { emitEvent: false });

        // Show advanced filters if any advanced filter is present
        this.showAdvancedFilters = !!(
          params['customerId'] || params['supplierId'] || params['folioNumber'] ||
          params['minAmount'] || params['maxAmount'] || params['tripId'] ||
          params['vehicleId'] || params['accountingPeriodStart'] || params['accountingPeriodEnd']
        );

        this.loadInvoices();
      });
  }

  private subscribeToFormChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.page = 1; // Reset to first page on filter change
        this.updateQueryParams();
      });
  }

  // Method for template compatibility with ngModel
  onFilterChange(): void {
    // This method is called from template but actual reactivity is handled by subscribeToFormChanges
    // Just trigger a manual update
    this.page = 1;
    this.updateQueryParams();
    this.loadInvoices();
  }

  // Update filter value from template
  updateFilter(key: string, value: any): void {
    this.filterForm.patchValue({ [key]: value }, { emitEvent: true });
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

    const filters = this.buildFiltersFromForm();

    this.invoiceService.getInvoices(filters, pagination).subscribe({
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

  private buildFiltersFromForm(): InvoiceFilters {
    const formValue = this.filterForm.value;
    const filters: InvoiceFilters = {};

    // Convert date strings to Date objects
    if (formValue.startDate) {
      filters.startDate = new Date(formValue.startDate);
    }
    if (formValue.endDate) {
      filters.endDate = new Date(formValue.endDate);
    }
    if (formValue.accountingPeriodStart) {
      filters.accountingPeriodStart = new Date(formValue.accountingPeriodStart);
    }
    if (formValue.accountingPeriodEnd) {
      filters.accountingPeriodEnd = new Date(formValue.accountingPeriodEnd);
    }

    // Copy other filters
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== null && formValue[key] !== undefined && formValue[key] !== '' &&
          !['startDate', 'endDate', 'accountingPeriodStart', 'accountingPeriodEnd'].includes(key)) {
        filters[key as keyof InvoiceFilters] = formValue[key];
      }
    });

    return filters;
  }

  clearFilters(): void {
    this.filterForm.reset({
      sortBy: 'issueDate',
      sortOrder: 'DESC'
    });
    this.page = 1;
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

  // Pagination methods
  onPageChange(page: number): void {
    this.page = Number(page);
    this.updateQueryParams();
    this.loadInvoices();
  }

  onLimitChange(limit: number): void {
    this.limit = Number(limit);
    this.page = 1;
    this.updateQueryParams();
    this.loadInvoices();
  }

  private updateQueryParams(): void {
    const formValue = this.filterForm.value;
    const queryParams: any = {
      page: this.page,
      limit: this.limit
    };

    // Add form values to query params (excluding null/undefined/empty)
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      replaceUrl: true
    });
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
