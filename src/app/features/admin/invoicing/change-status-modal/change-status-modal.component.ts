import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Invoice, InvoiceStatus, InvoiceType, InvoiceItem } from '../../../../core/models/invoice.model';
import { PaymentMethod, TransactionType } from '../../../../core/models/transaction.model';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-change-status-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-status-modal.component.html',
  styleUrl: './change-status-modal.component.scss'
})
export class ChangeStatusModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);

  @Output() statusChanged = new EventEmitter<{
    status: InvoiceStatus;
    categoryId?: string;
    itemCategories?: Array<{ invoiceItemId: string; categoryId: string }>;
    paymentMethod?: PaymentMethod;
    accountingPeriod?: string;
  }>();

  isOpen = false;
  changeStatusForm!: FormGroup;
  invoiceType: InvoiceType | null = null;
  currentStatus: InvoiceStatus | null = null;
  targetStatus: InvoiceStatus | null = null;
  invoiceItems: InvoiceItem[] = [];

  InvoiceStatus = InvoiceStatus;
  PaymentMethod = PaymentMethod;

  categories: any[] = [];
  loadingCategories = false;

  // Opciones de método de pago
  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia Bancaria' },
    { value: PaymentMethod.CARD, label: 'Tarjeta de Crédito/Débito' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.changeStatusForm = this.fb.group({
      categoryId: [''], // DEPRECATED - solo para facturas sin items
      paymentMethod: ['', Validators.required],
      accountingPeriod: ['', Validators.required],
      itemCategories: this.fb.array([]) // NUEVO - para facturas con items
    });
  }

  get itemCategories(): FormArray {
    return this.changeStatusForm.get('itemCategories') as FormArray;
  }

  open(invoiceType: InvoiceType, currentStatus: InvoiceStatus, targetStatus: InvoiceStatus, currentAccountingPeriod?: string, items?: InvoiceItem[]): void {
    this.invoiceType = invoiceType;
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.invoiceItems = items || [];
    this.isOpen = true;

    // Determinar si se necesitan los campos adicionales
    const needsAdditionalData = this.shouldRequestAdditionalData(invoiceType, targetStatus);

    if (needsAdditionalData) {
      // Cargar categorías según el tipo de factura
      this.loadCategories(invoiceType);

      // Si la factura tiene items, crear FormArray para categorías
      if (this.invoiceItems.length > 0) {
        this.createItemCategoriesFormArray(this.invoiceItems);
        // categoryId no es requerido cuando hay items
        this.changeStatusForm.get('categoryId')?.clearValidators();
      } else {
        // Si no hay items, usar categoryId (modo legacy)
        this.changeStatusForm.get('categoryId')?.setValidators([Validators.required]);
        // Limpiar itemCategories array
        this.itemCategories.clear();
      }

      // Hacer campos requeridos
      this.changeStatusForm.get('paymentMethod')?.setValidators([Validators.required]);
      this.changeStatusForm.get('accountingPeriod')?.setValidators([Validators.required]);
    } else {
      // Remover validaciones si no se necesitan
      this.changeStatusForm.get('categoryId')?.clearValidators();
      this.changeStatusForm.get('paymentMethod')?.clearValidators();
      this.changeStatusForm.get('accountingPeriod')?.clearValidators();
      this.itemCategories.clear();
    }

    this.changeStatusForm.get('categoryId')?.updateValueAndValidity();
    this.changeStatusForm.get('paymentMethod')?.updateValueAndValidity();
    this.changeStatusForm.get('accountingPeriod')?.updateValueAndValidity();

    // Reset y establecer valor inicial del periodo contable si existe
    this.changeStatusForm.patchValue({
      categoryId: '',
      paymentMethod: '',
      accountingPeriod: ''
    });

    if (currentAccountingPeriod) {
      // Convert to YYYY-MM format for month input
      const accountingPeriodMonth = currentAccountingPeriod.substring(0, 7); // Get YYYY-MM from YYYY-MM-DD
      this.changeStatusForm.patchValue({
        accountingPeriod: accountingPeriodMonth
      });
    }
  }

  createItemCategoriesFormArray(items: InvoiceItem[]): void {
    this.itemCategories.clear();

    items.forEach(item => {
      this.itemCategories.push(
        this.fb.group({
          invoiceItemId: [item.id, Validators.required],
          categoryId: ['', Validators.required],
          // Campos adicionales solo para mostrar en UI
          description: [item.description],
          quantity: [item.quantity],
          unitPrice: [item.unitPrice],
          subtotal: [item.subtotal],
        })
      );
    });
  }

  close(): void {
    this.isOpen = false;
    this.invoiceType = null;
    this.currentStatus = null;
    this.targetStatus = null;
    this.changeStatusForm.reset();
  }

  shouldRequestAdditionalData(invoiceType: InvoiceType, targetStatus: InvoiceStatus): boolean {
    // Para facturas de VENTA: se necesitan datos al cambiar a ISSUED o PAID
    if (invoiceType === InvoiceType.SALE && (targetStatus === InvoiceStatus.ISSUED || targetStatus === InvoiceStatus.PAID)) {
      return true;
    }

    // Para facturas de COMPRA: se necesitan datos solo al cambiar a PAID
    if (invoiceType === InvoiceType.PURCHASE && targetStatus === InvoiceStatus.PAID) {
      return true;
    }

    return false;
  }

  loadCategories(invoiceType: InvoiceType): void {
    this.loadingCategories = true;

    // Determinar el tipo de transacción según el tipo de factura
    const transactionType = invoiceType === InvoiceType.SALE
      ? TransactionType.INCOME
      : TransactionType.EXPENSE;

    this.transactionService.getCategories(transactionType).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loadingCategories = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.targetStatus) {
      return;
    }

    const needsAdditionalData = this.shouldRequestAdditionalData(this.invoiceType!, this.targetStatus);

    if (needsAdditionalData) {
      if (this.changeStatusForm.invalid) {
        this.changeStatusForm.markAllAsTouched();
        return;
      }

      const formValue = this.changeStatusForm.value;

      // Convert YYYY-MM to Date object (first day of month at midnight UTC)
      // El input type="month" devuelve "YYYY-MM", necesitamos crear un Date object
      let accountingPeriodDate: Date | undefined = undefined;
      if (formValue.accountingPeriod) {
        const [year, month] = formValue.accountingPeriod.split('-');
        // Crear fecha en UTC (medianoche del primer día del mes)
        accountingPeriodDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0));
      }

      // Construir payload
      const payload: any = {
        status: this.targetStatus,
        paymentMethod: formValue.paymentMethod,
        accountingPeriod: accountingPeriodDate?.toISOString() // Enviar como ISO string con timezone
      };

      // Si hay itemCategories, enviar eso; si no, categoryId
      if (formValue.itemCategories && formValue.itemCategories.length > 0) {
        payload.itemCategories = formValue.itemCategories.map((ic: any) => ({
          invoiceItemId: ic.invoiceItemId,
          categoryId: ic.categoryId,
        }));
      } else {
        payload.categoryId = formValue.categoryId;
      }

      this.statusChanged.emit(payload);
    } else {
      // No se necesitan datos adicionales, solo enviar el estado
      this.statusChanged.emit({
        status: this.targetStatus
      });
    }

    this.close();
  }

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

  get showAdditionalFields(): boolean {
    return this.targetStatus !== null && this.invoiceType !== null
      && this.shouldRequestAdditionalData(this.invoiceType, this.targetStatus);
  }
}
