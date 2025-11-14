import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Transaction, TransactionType, PaymentMethod } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.scss'
})
export class TransactionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);

  transaction: Transaction | null = null;
  isLoading = false;
  error: string | null = null;

  // Enums para template
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Object para template
  Object = Object;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
    } else {
      this.error = 'ID de transacción no válido';
    }
  }

  loadTransaction(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.transactionService.getTransactionById(id).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.error = 'Error al cargar la transacción';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/accounting']);
  }

  editTransaction(): void {
    if (this.transaction) {
      this.router.navigate(['/admin/accounting/edit', this.transaction.id]);
    }
  }

  deleteTransaction(): void {
    if (!this.transaction) return;

    if (confirm('¿Está seguro de eliminar esta transacción? Esta acción no se puede deshacer.')) {
      this.transactionService.deleteTransaction(this.transaction.id).subscribe({
        next: () => {
          this.router.navigate(['/admin/accounting']);
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
    return type === TransactionType.INCOME
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  getTypeIconColor(type: TransactionType): string {
    return type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600';
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'Efectivo',
      [PaymentMethod.TRANSFER]: 'Transferencia Bancaria',
      [PaymentMethod.CARD]: 'Tarjeta de Crédito/Débito',
      [PaymentMethod.CHECK]: 'Cheque'
    };
    return labels[method];
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    // SVG path strings for different payment methods
    const icons: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      [PaymentMethod.TRANSFER]: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      [PaymentMethod.CARD]: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      [PaymentMethod.CHECK]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[method];
  }

  hasRelatedEntities(): boolean {
    if (!this.transaction) return false;
    return !!(
      this.transaction.trip ||
      this.transaction.tripGroup ||
      this.transaction.invoice ||
      this.transaction.vehicle ||
      this.transaction.driver ||
      this.transaction.customer ||
      this.transaction.supplier
    );
  }

  hasAttachments(): boolean {
    return !!(this.transaction?.attachments && this.transaction.attachments.length > 0);
  }

  getTagColor(tagKey: string): string {
    // Generate consistent color based on tag key
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-teal-100 text-teal-800',
      'bg-orange-100 text-orange-800',
      'bg-cyan-100 text-cyan-800'
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < tagKey.length; i++) {
      hash = tagKey.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
