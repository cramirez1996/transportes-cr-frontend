import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalRef } from '../../../../core/services/modal.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { TransactionType, PaymentMethod, TransactionCategory } from '../../../../core/models/transaction.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './add-expense-modal.component.html',
  styleUrl: './add-expense-modal.component.scss'
})
export class AddExpenseModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private supplierService = inject(SupplierService);

  // Injected by ModalService
  modalRef!: ModalRef;
  data!: { tripGroupId: string; tripGroupCode: string };

  form!: FormGroup;
  loading = false;
  loadingCatalogs = true;
  error: string | null = null;

  // Catalogs
  categories: TransactionCategory[] = [];
  vehicles: any[] = [];
  drivers: any[] = [];
  suppliers: any[] = [];

  // Custom select options
  categoryOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  driverOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];
  paymentMethodOptions: CustomSelectOption[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogs();
    this.preparePaymentMethodOptions();
  }

  initForm(): void {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16);

    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(200)]],
      amount: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
      date: [dateStr, Validators.required],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      supplierId: [''],
      vehicleId: [''],
      driverId: [''],
      referenceNumber: ['', Validators.maxLength(100)]
    });
  }

  loadCatalogs(): void {
    this.loadingCatalogs = true;

    Promise.all([
      this.transactionService.getCategories(TransactionType.EXPENSE).toPromise(),
      this.vehicleService.getVehicles().toPromise(),
      this.driverService.getDrivers().toPromise(),
      this.supplierService.getSuppliers().toPromise()
    ]).then(([categories, vehicles, drivers, suppliers]) => {
      this.categories = categories || [];
      this.vehicles = vehicles || [];
      this.drivers = drivers || [];
      this.suppliers = suppliers || [];

      this.prepareSelectOptions();
      this.loadingCatalogs = false;
    }).catch(err => {
      console.error('Error loading catalogs:', err);
      this.error = 'Error al cargar los catálogos';
      this.loadingCatalogs = false;
    });
  }

  prepareSelectOptions(): void {
    // Category options (simple mode)
    this.categoryOptions = this.categories.map(category => ({
      value: category.id,
      label: category.name,
      data: { category }
    }));

    // Vehicle options (simple mode)
    this.vehicleOptions = this.vehicles.map(vehicle => ({
      value: vehicle.id,
      label: `${vehicle.licensePlate || vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`,
      data: { vehicle }
    }));

    // Driver options (simple mode)
    this.driverOptions = this.drivers.map(driver => ({
      value: driver.id,
      label: `${driver.firstName} ${driver.lastName}`,
      data: { driver }
    }));

    // Supplier options (simple mode)
    this.supplierOptions = this.suppliers.map(supplier => ({
      value: supplier.id,
      label: supplier.businessName,
      data: { supplier }
    }));
  }

  preparePaymentMethodOptions(): void {
    this.paymentMethodOptions = [
      { value: PaymentMethod.CASH, label: 'Efectivo', data: {} },
      { value: PaymentMethod.TRANSFER, label: 'Transferencia', data: {} },
      { value: PaymentMethod.CARD, label: 'Tarjeta', data: {} },
      { value: PaymentMethod.CHECK, label: 'Cheque', data: {} }
    ];
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.form.value;

    const expenseData = {
      type: TransactionType.EXPENSE,
      categoryId: formValue.categoryId,
      description: formValue.description,
      amount: Number(formValue.amount),
      date: new Date(formValue.date),
      paymentMethod: formValue.paymentMethod,
      tripGroupId: this.data.tripGroupId,
      supplierId: formValue.supplierId || undefined,
      vehicleId: formValue.vehicleId || undefined,
      driverId: formValue.driverId || undefined,
      referenceNumber: formValue.referenceNumber || undefined
    };

    this.transactionService.createTransaction(expenseData).subscribe({
      next: (createdExpense) => {
        // Success - close modal and return the created expense
        this.modalRef.close(createdExpense);
      },
      error: (error) => {
        console.error('Error creating expense:', error);
        this.error = 'Error al crear el gasto';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.modalRef.dismiss();
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  }

  // Helpers para mostrar errores
  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
