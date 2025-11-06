import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice, InvoiceType, InvoiceStatus, InvoiceItem, InvoiceTax, SII_DOCUMENT_TYPES } from '../../../../core/models/invoice.model';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { Customer } from '../../../../core/models/business/customer.model';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/trip.model';
import { TripService } from '../../../../core/services/trip.service';
import { Trip } from '../../../../core/models/trip.model';
import { TagsEditorComponent } from '../../../../shared/components/tags-editor/tags-editor.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-invoice-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TagsEditorComponent, CustomSelectComponent],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private supplierService = inject(SupplierService);
  private tripService = inject(TripService);

  invoiceForm!: FormGroup;
  isEditMode = false;
  invoiceId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  InvoiceType = InvoiceType;
  InvoiceStatus = InvoiceStatus;

  // Listas de datos
  customers: Customer[] = [];
  suppliers: Supplier[] = [];
  trips: Trip[] = [];

  // Options for custom-select components
  typeOptions: CustomSelectOption[] = [
    { value: InvoiceType.SALE, label: 'Venta' },
    { value: InvoiceType.PURCHASE, label: 'Compra' }
  ];
  documentTypeOptions: CustomSelectOption[] = SII_DOCUMENT_TYPES.map(dt => ({
    value: dt.code,
    label: `${dt.code} - ${dt.name}`
  }));
  customerOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];
  tripOptions: CustomSelectOption[] = [];

  // Códigos de impuestos SII
  taxCodes = [
    { code: 28, name: 'Impuesto específico a combustibles' },
    { code: 35, name: 'Impuesto específico a gases' },
    { code: 271, name: 'Impuesto específico Diésel' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
    this.loadSuppliers();
    this.loadTrips();

    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (this.invoiceId) {
      this.isEditMode = true;
      this.loadInvoice(this.invoiceId);
    } else {
      this.addItem(); // Agregar una línea por defecto
    }

    // Listen to invoice type changes to update validation
    this.invoiceForm.get('type')?.valueChanges.subscribe((type) => {
      this.updateCustomerSupplierValidation(type);
    });

    // Listen to issue date changes to auto-update accounting period
    this.invoiceForm.get('issueDate')?.valueChanges.subscribe((issueDate) => {
      if (issueDate) {
        this.updateAccountingPeriodFromIssueDate(issueDate);
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.customerOptions = customers.map(c => ({
          value: c.id,
          label: c.businessName,
          data: {
            rut: c.rut,
            avatar: this.getInitials(c.businessName)
          }
        }));
      },
      error: (err) => {
        console.error('Error loading customers:', err);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.supplierOptions = suppliers.map(s => ({
          value: s.id,
          label: s.businessName,
          data: {
            rut: s.rut,
            avatar: this.getInitials(s.businessName)
          }
        }));
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
      }
    });
  }

  loadTrips(): void {
    // Load trips for custom-select (high limit for dropdown)
    this.tripService.getTrips({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.trips = response.data;
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
      error: (err) => {
        console.error('Error loading trips:', err);
      }
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

  updateCustomerSupplierValidation(type: InvoiceType): void {
    const customerIdControl = this.invoiceForm.get('customerId');
    const supplierIdControl = this.invoiceForm.get('supplierId');

    if (type === InvoiceType.SALE) {
      // For SALE invoices, customer is required
      customerIdControl?.setValidators([Validators.required]);
      supplierIdControl?.clearValidators();
      supplierIdControl?.setValue(null);
    } else if (type === InvoiceType.PURCHASE) {
      // For PURCHASE invoices, supplier is required
      supplierIdControl?.setValidators([Validators.required]);
      customerIdControl?.clearValidators();
      customerIdControl?.setValue(null);
    }

    customerIdControl?.updateValueAndValidity();
    supplierIdControl?.updateValueAndValidity();
  }

  updateAccountingPeriodFromIssueDate(issueDate: string): void {
    // Extract year-month from issueDate (YYYY-MM-DD -> YYYY-MM)
    const yearMonth = issueDate.substring(0, 7); // Get 'YYYY-MM' from 'YYYY-MM-DD'
    this.invoiceForm.patchValue(
      { accountingPeriod: yearMonth },
      { emitEvent: false }
    );
  }

  initForm(): void {
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    this.invoiceForm = this.fb.group({
      type: [InvoiceType.SALE, Validators.required],
      documentType: [33, Validators.required],
      folioNumber: ['', Validators.required],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      accountingPeriod: [currentYearMonth, Validators.required], // YYYY-MM format for month input
      customerId: ['', Validators.required], // Required by default (SALE)
      supplierId: [''],
      tripId: [''],
      vehicleId: [''],
      notes: [''],
      tags: [{}],
      items: this.fb.array([]),
      taxes: this.fb.array([])
    });

    // Calcular totales cuando cambian los items o impuestos
    this.items.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.taxes.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  loadInvoice(id: string): void {
    this.loading = true;
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.patchFormValues(invoice);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la factura';
        console.error(err);
        this.loading = false;
      }
    });
  }

  patchFormValues(invoice: Invoice): void {
    // Extract year-month from accountingPeriod (YYYY-MM-DD -> YYYY-MM)
    const accountingYearMonth = invoice.accountingPeriod.substring(0, 7); // Get 'YYYY-MM' from 'YYYY-MM-DD'

    this.invoiceForm.patchValue({
      type: invoice.type,
      documentType: invoice.documentType,
      folioNumber: invoice.folioNumber,
      issueDate: invoice.issueDate, // Already in YYYY-MM-DD format
      accountingPeriod: accountingYearMonth,
      customerId: invoice.customer?.id,
      supplierId: invoice.supplier?.id,
      tripId: invoice.trip?.id,
      vehicleId: invoice.vehicle?.id,
      notes: invoice.notes,
      tags: invoice.tags || {}
    });

    // Cargar items
    invoice.items.forEach(item => {
      this.addItem(item);
    });

    // Cargar impuestos adicionales
    invoice.taxes?.forEach(tax => {
      this.addTax(tax);
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  get taxes(): FormArray {
    return this.invoiceForm.get('taxes') as FormArray;
  }

  createItemFormGroup(item?: InvoiceItem): FormGroup {
    return this.fb.group({
      description: [item?.description || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      isExempt: [item?.isExempt || false],
      discountPercent: [item?.discountPercent || 0, [Validators.min(0), Validators.max(100)]],
      subtotal: [{ value: item?.subtotal || 0, disabled: true }]
    });
  }

  createTaxFormGroup(tax?: InvoiceTax): FormGroup {
    const defaultTaxCode = tax?.taxCode || 28;
    const defaultTaxName = tax?.taxName || this.taxCodes.find(t => t.code === defaultTaxCode)?.name || '';

    return this.fb.group({
      taxCode: [defaultTaxCode, Validators.required],
      taxName: [defaultTaxName, Validators.required],
      taxAmount: [tax?.taxAmount || 0, [Validators.required, Validators.min(0)]],
      taxRate: [tax?.taxRate || 0, Validators.min(0)]
    });
  }

  addItem(item?: InvoiceItem): void {
    this.items.push(this.createItemFormGroup(item));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  addTax(tax?: InvoiceTax): void {
    this.taxes.push(this.createTaxFormGroup(tax));
  }

  removeTax(index: number): void {
    this.taxes.removeAt(index);
  }

  onTaxCodeChange(index: number): void {
    const tax = this.taxes.at(index);
    const taxCode = tax.get('taxCode')?.value;
    const selectedTax = this.taxCodes.find(t => t.code === Number(taxCode));

    if (selectedTax) {
      tax.patchValue({ taxName: selectedTax.name }, { emitEvent: false });
    }
  }

  calculateItemSubtotal(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const discountPercent = item.get('discountPercent')?.value || 0;

    const total = quantity * unitPrice;
    const discount = total * (discountPercent / 100);
    const subtotal = total - discount;

    item.patchValue({ subtotal }, { emitEvent: false });
  }

  calculateTotals(): void {
    let totalExempt = 0;
    let totalNet = 0;

    this.items.controls.forEach((control, index) => {
      this.calculateItemSubtotal(index);
      const item = control.value;
      const subtotal = item.subtotal || 0;

      if (item.isExempt) {
        totalExempt += subtotal;
      } else {
        totalNet += subtotal;
      }
    });

    return;
  }

  getTotalExempt(): number {
    return this.items.controls
      .filter(c => c.get('isExempt')?.value)
      .reduce((sum, c) => sum + (c.get('subtotal')?.value || 0), 0);
  }

  getTotalNet(): number {
    return this.items.controls
      .filter(c => !c.get('isExempt')?.value)
      .reduce((sum, c) => sum + (c.get('subtotal')?.value || 0), 0);
  }

  getTotalIVA(): number {
    return this.getTotalNet() * 0.19;
  }

  getTotalAdditionalTaxes(): number {
    return this.taxes.controls.reduce((sum, c) => sum + (c.get('taxAmount')?.value || 0), 0);
  }

  getGrandTotal(): number {
    return this.getTotalExempt() + this.getTotalNet() + this.getTotalIVA() + this.getTotalAdditionalTaxes();
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.invoiceForm.getRawValue();

    // Convert YYYY-MM to first day of month (YYYY-MM-01)
    const accountingPeriodDate = formValue.accountingPeriod
      ? `${formValue.accountingPeriod}-01`
      : null;

    const invoiceData = {
      ...formValue,
      // Convert YYYY-MM to date
      accountingPeriod: accountingPeriodDate,
      // Convert empty strings to null for optional UUID fields
      customerId: formValue.customerId || null,
      supplierId: formValue.supplierId || null,
      tripId: formValue.tripId || null,
      vehicleId: formValue.vehicleId || null,
      // Add calculated totals
      amountExempt: this.getTotalExempt(),
      amountNet: this.getTotalNet(),
      ivaRecoverable: this.getTotalIVA(),
      totalAmount: this.getGrandTotal(),
      items: formValue.items,
      taxes: formValue.taxes
    };

    const request = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoiceId!, invoiceData)
      : this.invoiceService.createInvoice(invoiceData);

    request.subscribe({
      next: () => {
        this.router.navigate(['/admin/invoicing']);
      },
      error: (err) => {
        this.error = 'Error al guardar la factura';
        console.error(err);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/invoicing']);
  }

  onTagsChange(tags: Record<string, any>): void {
    this.invoiceForm.patchValue({ tags });
  }
}
