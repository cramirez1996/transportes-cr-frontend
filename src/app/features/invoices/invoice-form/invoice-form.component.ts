import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice, InvoiceType, InvoiceStatus, InvoiceItem } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.scss'
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);

  invoiceForm!: FormGroup;
  isEditMode = false;
  invoiceId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  InvoiceType = InvoiceType;
  InvoiceStatus = InvoiceStatus;

  ngOnInit(): void {
    this.initForm();

    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (this.invoiceId) {
      this.isEditMode = true;
      this.loadInvoice(this.invoiceId);
    } else {
      this.addItem(); // Agregar una línea por defecto
    }
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      type: [InvoiceType.SALE, Validators.required],
      documentType: [33, Validators.required],
      folioNumber: ['', Validators.required],
      issueDate: [new Date().toISOString().split('T')[0], Validators.required],
      customerId: [''],
      supplierId: [''],
      tripId: [''],
      vehicleId: [''],
      notes: [''],
      status: [InvoiceStatus.DRAFT],
      items: this.fb.array([])
    });

    // Calcular totales cuando cambian los items
    this.items.valueChanges.subscribe(() => {
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
    this.invoiceForm.patchValue({
      type: invoice.type,
      documentType: invoice.documentType,
      folioNumber: invoice.folioNumber,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      customerId: invoice.customer?.id,
      supplierId: invoice.supplier?.id,
      tripId: invoice.trip?.id,
      vehicleId: invoice.vehicle?.id,
      notes: invoice.notes,
      status: invoice.status
    });

    // Cargar items
    invoice.items.forEach(item => {
      this.addItem(item);
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
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

  addItem(item?: InvoiceItem): void {
    this.items.push(this.createItemFormGroup(item));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
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

  getGrandTotal(): number {
    return this.getTotalExempt() + this.getTotalNet() + this.getTotalIVA();
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.invoiceForm.getRawValue();
    const invoiceData = {
      ...formValue,
      amountExempt: this.getTotalExempt(),
      amountNet: this.getTotalNet(),
      ivaRecoverable: this.getTotalIVA(),
      totalAmount: this.getGrandTotal(),
      items: formValue.items
    };

    const request = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoiceId!, invoiceData)
      : this.invoiceService.createInvoice(invoiceData);

    request.subscribe({
      next: () => {
        this.router.navigate(['/invoices']);
      },
      error: (err) => {
        this.error = 'Error al guardar la factura';
        console.error(err);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }
}
