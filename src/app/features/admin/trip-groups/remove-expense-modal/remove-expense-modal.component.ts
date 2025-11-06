import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalRef } from '../../../../core/services/modal.service';
import { TransactionService } from '../../../../core/services/transaction.service';

@Component({
  selector: 'app-remove-expense-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './remove-expense-modal.component.html',
  styleUrl: './remove-expense-modal.component.scss'
})
export class RemoveExpenseModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);

  // Injected by ModalService
  modalRef!: ModalRef;
  data!: {
    expenseId: string;
    expenseDescription: string;
  };

  removeForm!: FormGroup;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.removeForm = this.fb.group({
      deleteCompletely: [false]
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.error = null;

    const deleteCompletely = this.removeForm.value.deleteCompletely;

    if (deleteCompletely) {
      // Delete transaction permanently
      this.transactionService.deleteTransaction(this.data.expenseId).subscribe({
        next: () => {
          this.modalRef.close({ deleted: true });
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.error = 'Error al eliminar el gasto de forma permanente';
          this.loading = false;
        }
      });
    } else {
      // Just remove from trip group (set tripGroupId to null)
      this.transactionService.updateTransaction(this.data.expenseId, { tripGroupId: null }).subscribe({
        next: () => {
          this.modalRef.close({ deleted: false });
        },
        error: (error) => {
          console.error('Error removing expense from group:', error);
          this.error = 'Error al quitar el gasto del grupo';
          this.loading = false;
        }
      });
    }
  }

  close(): void {
    this.modalRef.dismiss();
  }
}
