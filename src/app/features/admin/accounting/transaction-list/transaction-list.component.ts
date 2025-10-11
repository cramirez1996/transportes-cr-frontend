import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Transaction, TransactionType, PaymentMethod } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = false;

  // Filtros
  filterType: TransactionType | '' = '';
  filterStartDate: string = '';
  filterEndDate: string = '';
  searchTerm: string = '';

  // Enums para template
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const filters: any = {};

    if (this.filterType) filters.type = this.filterType;
    if (this.filterStartDate) filters.startDate = new Date(this.filterStartDate);
    if (this.filterEndDate) filters.endDate = new Date(this.filterEndDate);

    this.transactionService.getTransactions(filters).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applySearchFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  applySearchFilter(): void {
    if (!this.searchTerm) {
      this.filteredTransactions = this.transactions;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredTransactions = this.transactions.filter(t =>
      t.description.toLowerCase().includes(term) ||
      t.category?.name.toLowerCase().includes(term) ||
      t.referenceNumber?.toLowerCase().includes(term)
    );
  }

  onFilterChange(): void {
    this.loadTransactions();
  }

  onSearchChange(): void {
    this.applySearchFilter();
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
