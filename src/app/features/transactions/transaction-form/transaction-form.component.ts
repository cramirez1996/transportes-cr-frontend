import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionType, PaymentMethod, TransactionCategory } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);

  transactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  categories: TransactionCategory[] = [];
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode = true;
      this.loadTransaction(this.transactionId);
    }
  }

  initForm(): void {
    this.transactionForm = this.fb.group({
      type: [TransactionType.EXPENSE, Validators.required],
      categoryId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: ['']
    });
  }

  loadCategories(): void {
    this.transactionService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadTransaction(id: string): void {
    this.loading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (transaction) => {
        this.transactionForm.patchValue({
          type: transaction.type,
          categoryId: transaction.category?.id,
          amount: transaction.amount,
          date: new Date(transaction.date).toISOString().split('T')[0],
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          referenceNumber: transaction.referenceNumber
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la transacción';
        console.error(err);
        this.loading = false;
      }
    });
  }

  get filteredCategories(): TransactionCategory[] {
    const type = this.transactionForm.get('type')?.value;
    return this.categories.filter(c => c.type === type);
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const request = this.isEditMode
      ? this.transactionService.updateTransaction(this.transactionId!, this.transactionForm.value)
      : this.transactionService.createTransaction(this.transactionForm.value);

    request.subscribe({
      next: () => {
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.error = 'Error al guardar la transacción';
        console.error(err);
        this.saving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/transactions']);
  }
}
