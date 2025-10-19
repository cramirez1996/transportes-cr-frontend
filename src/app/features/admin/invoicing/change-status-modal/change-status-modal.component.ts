import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InvoiceStatus, InvoiceType } from '../../../../core/models/invoice.model';
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
    paymentMethod?: PaymentMethod;
  }>();

  isOpen = false;
  changeStatusForm!: FormGroup;
  invoiceType: InvoiceType | null = null;
  currentStatus: InvoiceStatus | null = null;
  targetStatus: InvoiceStatus | null = null;

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
      categoryId: ['', Validators.required],
      paymentMethod: ['', Validators.required]
    });
  }

  open(invoiceType: InvoiceType, currentStatus: InvoiceStatus, targetStatus: InvoiceStatus): void {
    this.invoiceType = invoiceType;
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.isOpen = true;

    // Determinar si se necesitan los campos adicionales
    const needsAdditionalData = this.shouldRequestAdditionalData(invoiceType, targetStatus);

    if (needsAdditionalData) {
      // Cargar categorías según el tipo de factura
      this.loadCategories(invoiceType);

      // Hacer campos requeridos
      this.changeStatusForm.get('categoryId')?.setValidators([Validators.required]);
      this.changeStatusForm.get('paymentMethod')?.setValidators([Validators.required]);
    } else {
      // Remover validaciones si no se necesitan
      this.changeStatusForm.get('categoryId')?.clearValidators();
      this.changeStatusForm.get('paymentMethod')?.clearValidators();
    }

    this.changeStatusForm.get('categoryId')?.updateValueAndValidity();
    this.changeStatusForm.get('paymentMethod')?.updateValueAndValidity();
    this.changeStatusForm.reset();
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
      this.statusChanged.emit({
        status: this.targetStatus,
        categoryId: formValue.categoryId,
        paymentMethod: formValue.paymentMethod
      });
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
      [InvoiceStatus.CANCELLED]: 'Anulada'
    };
    return labels[status];
  }

  get showAdditionalFields(): boolean {
    return this.targetStatus !== null && this.invoiceType !== null
      && this.shouldRequestAdditionalData(this.invoiceType, this.targetStatus);
  }
}
