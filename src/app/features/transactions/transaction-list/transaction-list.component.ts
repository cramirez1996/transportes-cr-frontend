import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import {
  Transaction,
  TransactionType,
  TransactionFilters,
  PaymentMethod,
  TransactionStatistics
} from '../../../core/models/transaction.model';

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
  loading = false;
  error: string | null = null;
  statistics: TransactionStatistics | null = null;

  // Filtros
  filters: TransactionFilters = {};
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  ngOnInit(): void {
    this.loadTransactions();
    this.loadStatistics();
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = null;

    this.transactionService.getTransactions(this.filters).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las transacciones';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadStatistics(): void {
    const statsFilters = {
      startDate: this.filters.startDate,
      endDate: this.filters.endDate,
      categoryId: this.filters.categoryId
    };

    this.transactionService.getStatistics(statsFilters).subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactions;
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
  }

  onFilterChange(): void {
    this.loadTransactions();
    this.loadStatistics();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadTransactions();
    this.loadStatistics();
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`¿Estás seguro de eliminar esta transacción?`)) {
      this.transactionService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.loadTransactions();
          this.loadStatistics();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar la transacción');
        }
      });
    }
  }

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTransactions.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getTypeLabel(type: TransactionType): string {
    return type === TransactionType.INCOME ? 'Ingreso' : 'Gasto';
  }

  getTypeClass(type: TransactionType): string {
    return type === TransactionType.INCOME
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.TRANSFER]: 'Transferencia',
      [PaymentMethod.CARD]: 'Tarjeta',
      [PaymentMethod.CHECK]: 'Cheque'
    };
    return labels[method];
  }
}
