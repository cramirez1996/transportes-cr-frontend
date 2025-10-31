import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionCategory, TransactionType } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss'
})
export class CategoryManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);

  categories: TransactionCategory[] = [];
  categoryForm!: FormGroup;
  loading = false;
  showForm = false;
  editingId: string | null = null;

  TransactionType = TransactionType;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      type: [TransactionType.EXPENSE, Validators.required]
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.transactionService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loading = false;
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.editingId = null;
    this.categoryForm.reset({ type: TransactionType.EXPENSE });
  }

  editCategory(category: TransactionCategory): void {
    this.showForm = true;
    this.editingId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const request = this.editingId
      ? this.transactionService.updateCategory(this.editingId, this.categoryForm.value)
      : this.transactionService.createCategory(this.categoryForm.value);

    request.subscribe({
      next: () => {
        this.loadCategories();
        this.cancelForm();
      },
      error: (err) => console.error('Error al guardar:', err)
    });
  }

  deleteCategory(id: string): void {
    if (confirm('¿Está seguro de eliminar esta categoría?')) {
      this.transactionService.deleteCategory(id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => alert('No se puede eliminar esta categoría. Puede tener transacciones asociadas.')
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.categoryForm.reset();
  }

  getTypeLabel(type: TransactionType): string {
    return type === TransactionType.INCOME ? 'Ingreso' : 'Gasto';
  }
}
