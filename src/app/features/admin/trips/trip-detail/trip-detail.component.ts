import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TripService } from '../../../../core/services/trip.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Trip, TripStatus } from '../../../../core/models/trip.model';
import { Transaction, TransactionType, TransactionCategory, CreateTransactionDto, PaymentMethod } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.scss'
})
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private transactionService = inject(TransactionService);
  private fb = inject(FormBuilder);

  trip: Trip | null = null;
  expenses: Transaction[] = [];
  expenseCategories: TransactionCategory[] = [];
  loading = false;
  showExpenseForm = false;
  expenseForm!: FormGroup;
  editingExpenseId: string | null = null;

  // Status configuration
  statusLabels = {
    [TripStatus.PENDING]: 'Pendiente',
    [TripStatus.IN_PROGRESS]: 'En Curso',
    [TripStatus.COMPLETED]: 'Completado',
    [TripStatus.CANCELLED]: 'Cancelado'
  };

  statusColors = {
    [TripStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TripStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TripStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [TripStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };

  // Payment methods
  paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethod.CARD, label: 'Tarjeta' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  ngOnInit(): void {
    this.initExpenseForm();
    this.loadExpenseCategories();
    this.loadTripDetail();
  }

  initExpenseForm(): void {
    this.expenseForm = this.fb.group({
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: [''],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadExpenseCategories(): void {
    this.transactionService.getCategories(TransactionType.EXPENSE).subscribe({
      next: (categories) => {
        this.expenseCategories = categories;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  loadTripDetail(): void {
    const tripId = this.route.snapshot.paramMap.get('id');
    if (!tripId) {
      alert('ID de viaje no válido');
      this.router.navigate(['/admin/trips']);
      return;
    }

    this.loading = true;
    this.tripService.getTripById(tripId).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadExpenses(tripId);
      },
      error: (err) => {
        console.error('Error al cargar viaje:', err);
        alert('Error al cargar el detalle del viaje');
        this.loading = false;
      }
    });
  }

  loadExpenses(tripId: string): void {
    this.transactionService.getTransactions({
      type: TransactionType.EXPENSE,
      tripId: tripId
    }).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
        this.updateTripCalculations();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        this.loading = false;
      }
    });
  }

  updateTripCalculations(): void {
    if (!this.trip) return;

    const totalExpenses = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const agreedPrice = parseFloat(this.trip.agreedPrice);

    this.trip.totalExpenses = totalExpenses;
    this.trip.profit = agreedPrice - totalExpenses;
  }

  toggleExpenseForm(): void {
    this.showExpenseForm = !this.showExpenseForm;
    if (!this.showExpenseForm) {
      this.resetExpenseForm();
    }
  }

  resetExpenseForm(): void {
    this.editingExpenseId = null;
    this.expenseForm.reset({
      categoryId: '',
      description: '',
      amount: 0,
      paymentMethod: PaymentMethod.CASH,
      referenceNumber: '',
      date: new Date().toISOString().split('T')[0]
    });
  }

  saveExpense(): void {
    if (this.expenseForm.invalid || !this.trip) return;

    const formValue = this.expenseForm.value;
    const expenseData: CreateTransactionDto = {
      type: TransactionType.EXPENSE,
      categoryId: formValue.categoryId,
      description: formValue.description,
      amount: parseFloat(formValue.amount),
      paymentMethod: formValue.paymentMethod,
      referenceNumber: formValue.referenceNumber || undefined,
      date: new Date(formValue.date),
      tripId: this.trip.id
    };

    if (this.editingExpenseId) {
      // Update existing expense
      this.transactionService.updateTransaction(this.editingExpenseId, expenseData).subscribe({
        next: () => {
          alert('Gasto actualizado exitosamente');
          this.loadExpenses(this.trip!.id);
          this.toggleExpenseForm();
        },
        error: (err) => {
          console.error('Error al actualizar gasto:', err);
          alert('Error al actualizar el gasto');
        }
      });
    } else {
      // Create new expense
      this.transactionService.createTransaction(expenseData).subscribe({
        next: () => {
          alert('Gasto agregado exitosamente');
          this.loadExpenses(this.trip!.id);
          this.toggleExpenseForm();
        },
        error: (err) => {
          console.error('Error al agregar gasto:', err);
          alert('Error al agregar el gasto');
        }
      });
    }
  }

  editExpense(expense: Transaction): void {
    this.editingExpenseId = expense.id;
    this.showExpenseForm = true;

    this.expenseForm.patchValue({
      categoryId: expense.category?.id || '',
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      referenceNumber: expense.referenceNumber || '',
      date: expense.date ? this.formatDateForInput(expense.date) : ''
    });
  }

  deleteExpense(expense: Transaction): void {
    if (!this.trip) return;

    if (confirm(`¿Eliminar el gasto "${expense.description}"?`)) {
      this.transactionService.deleteTransaction(expense.id).subscribe({
        next: () => {
          alert('Gasto eliminado exitosamente');
          this.loadExpenses(this.trip!.id);
        },
        error: (err) => {
          console.error('Error al eliminar gasto:', err);
          alert('Error al eliminar el gasto');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/trips']);
  }

  formatDate(date: Date | undefined | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined) return '$0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(numAmount);
  }

  canEditExpenses(): boolean {
    return this.trip?.status !== TripStatus.CANCELLED;
  }

  calculateProfitMargin(): number {
    if (!this.trip || !this.trip.profit) return 0;
    const agreedPrice = parseFloat(this.trip.agreedPrice);
    if (agreedPrice === 0) return 0;
    return (this.trip.profit / agreedPrice) * 100;
  }
}
