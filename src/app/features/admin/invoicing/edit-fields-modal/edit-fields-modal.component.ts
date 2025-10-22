import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-fields-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-fields-modal.component.html',
  styleUrl: './edit-fields-modal.component.scss'
})
export class EditFieldsModalComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Output() fieldsUpdated = new EventEmitter<{
    accountingPeriod: string;
    notes?: string;
  }>();

  isOpen = false;
  editFieldsForm!: FormGroup;
  invoiceId: string | null = null;
  invoiceFolio: string | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.editFieldsForm = this.fb.group({
      accountingPeriod: ['', Validators.required],
      notes: ['']
    });
  }

  open(invoiceId: string, invoiceFolio: string, currentAccountingPeriod?: string, currentNotes?: string): void {
    this.invoiceId = invoiceId;
    this.invoiceFolio = invoiceFolio;
    this.isOpen = true;

    // Convert to YYYY-MM format for month input
    const accountingPeriodMonth = currentAccountingPeriod
      ? currentAccountingPeriod.substring(0, 7) // Get YYYY-MM from YYYY-MM-DD
      : '';

    this.editFieldsForm.patchValue({
      accountingPeriod: accountingPeriodMonth,
      notes: currentNotes || ''
    });
  }

  close(): void {
    this.isOpen = false;
    this.invoiceId = null;
    this.invoiceFolio = null;
    this.editFieldsForm.reset();
  }

  onSubmit(): void {
    if (this.editFieldsForm.invalid) {
      this.editFieldsForm.markAllAsTouched();
      return;
    }

    const formValue = this.editFieldsForm.value;

    // Convert YYYY-MM to YYYY-MM-01 (first day of month)
    const accountingPeriodDate = formValue.accountingPeriod
      ? `${formValue.accountingPeriod}-01`
      : undefined;

    this.fieldsUpdated.emit({
      accountingPeriod: accountingPeriodDate!,
      notes: formValue.notes
    });

    this.close();
  }
}
