import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Transaction, TransactionType, PaymentMethod } from '../../../../core/models/transaction.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../../../shared/components/dropdown-item/dropdown-item.component';
import { DropdownDividerComponent } from '../../../../shared/components/dropdown-divider/dropdown-divider.component';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomSelectComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent
  ],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = false;

  // Filtros
  filters = {
    type: undefined as TransactionType | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    search: ''
  };

  // UI State
  showAdvancedFilters = false;
  activeFiltersCount = 0;

  // Date input bindings
  startDateInput = '';
  endDateInput = '';

  // Enums para template
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Custom select options
  typeOptions: CustomSelectOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: TransactionType.INCOME, label: 'Ingresos' },
    { value: TransactionType.EXPENSE, label: 'Gastos' }
  ];

  paymentMethodOptions: CustomSelectOption[] = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethod.CARD, label: 'Tarjeta' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const apiFilters: any = {};

    // Convert filter values to API format
    if (this.filters.type) apiFilters.type = this.filters.type;
    if (this.filters.startDate) apiFilters.startDate = this.filters.startDate;
    if (this.filters.endDate) apiFilters.endDate = this.filters.endDate;

    this.transactionService.getTransactions(apiFilters).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applySearchFilter();
        this.updateActiveFiltersCount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  applySearchFilter(): void {
    if (!this.filters.search) {
      this.filteredTransactions = this.transactions;
      return;
    }

    const term = this.filters.search.toLowerCase();
    this.filteredTransactions = this.transactions.filter(t =>
      t.description.toLowerCase().includes(term) ||
      t.category?.name.toLowerCase().includes(term) ||
      t.referenceNumber?.toLowerCase().includes(term)
    );
  }

  onFilterChange(): void {
    // Update date filters from input strings
    this.filters.startDate = this.startDateInput ? new Date(this.startDateInput) : undefined;
    this.filters.endDate = this.endDateInput ? new Date(this.endDateInput) : undefined;

    this.loadTransactions();
  }

  updateActiveFiltersCount(): void {
    let count = 0;
    if (this.filters.type) count++;
    if (this.filters.startDate) count++;
    if (this.filters.endDate) count++;
    if (this.filters.search) count++;
    this.activeFiltersCount = count;
  }

  clearFilters(): void {
    this.filters = {
      type: undefined,
      startDate: undefined,
      endDate: undefined,
      search: ''
    };
    this.startDateInput = '';
    this.endDateInput = '';
    this.loadTransactions();
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
    // Add logic if needed (e.g., only delete draft transactions)
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
}
