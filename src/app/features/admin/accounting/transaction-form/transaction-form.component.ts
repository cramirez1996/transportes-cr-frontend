import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TransactionService } from '../../../../core/services/transaction.service';
import { TransactionType, PaymentMethod, TransactionCategory } from '../../../../core/models/transaction.model';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { TripService } from '../../../../core/services/trip.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Customer } from '../../../../core/models/business/customer.model';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { Driver } from '../../../../core/models/business/driver.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);
  private customerService = inject(CustomerService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private tripService = inject(TripService);
  private invoiceService = inject(InvoiceService);

  transactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  isLoading = false;

  // Datos para selects
  categories: TransactionCategory[] = [];
  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  trips: any[] = [];
  invoices: any[] = [];
  suppliers: any[] = []; // TODO: Implementar servicio de suppliers cuando est� disponible

  // Enums para template
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Tags management
  tags: { key: string; value: string }[] = [];
  newTagKey = '';
  newTagValue = '';

  ngOnInit(): void {
    this.initForm();
    this.loadRelatedData();

    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode = true;
      this.loadTransaction(this.transactionId);
    }

    // Suscribirse a cambios de tipo para validaciones
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.applyBusinessRules();
    });
  }

  initForm(): void {
    this.transactionForm = this.fb.group({
      type: [TransactionType.EXPENSE, Validators.required],
      categoryId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: [''],
      invoiceId: [''],
      tripId: [''],
      vehicleId: [''],
      driverId: [''],
      customerId: [''],
      supplierId: ['']
    });
  }

  loadRelatedData(): void {
    this.isLoading = true;

    forkJoin({
      categories: this.transactionService.getCategories(),
      customers: this.customerService.getCustomers(),
      vehicles: this.vehicleService.getVehicles(),
      drivers: this.driverService.getDrivers(),
      trips: this.tripService.getTrips(),
      invoices: this.invoiceService.getInvoices()
    }).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.customers = data.customers;
        this.vehicles = data.vehicles;
        this.drivers = data.drivers;
        this.trips = data.trips;
        this.invoices = data.invoices;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading related data:', error);
        this.isLoading = false;
      }
    });
  }

  loadTransaction(id: string): void {
    this.isLoading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (transaction) => {
        this.transactionForm.patchValue({
          type: transaction.type,
          categoryId: transaction.category?.id,
          amount: transaction.amount,
          date: new Date(transaction.date).toISOString().split('T')[0],
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          referenceNumber: transaction.referenceNumber,
          invoiceId: transaction.invoice?.id || '',
          tripId: transaction.trip?.id || '',
          vehicleId: transaction.vehicle?.id || '',
          driverId: transaction.driver?.id || '',
          customerId: transaction.customer?.id || '',
          supplierId: transaction.supplier?.id || ''
        });

        // Load tags if they exist
        if (transaction.tags) {
          this.tags = Object.entries(transaction.tags).map(([key, value]) => ({
            key,
            value: String(value)
          }));
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.isLoading = false;
      }
    });
  }

  onTypeChange(): void {
    this.applyBusinessRules();
  }

  /**
   * Reglas de negocio seg�n la documentaci�n:
   * - INCOME (Ingresos): Generalmente asociados a clientes y facturas de venta
   * - EXPENSE (Gastos): Pueden asociarse a proveedores, facturas de compra, viajes, veh�culos, conductores
   */
  applyBusinessRules(): void {
    const type = this.transactionForm.get('type')?.value;

    if (type === TransactionType.INCOME) {
      // Para ingresos, es com�n tener cliente
      // Los gastos de viaje/veh�culo/conductor son menos relevantes para ingresos
      this.transactionForm.get('customerId')?.setValidators([]);
      this.transactionForm.get('supplierId')?.clearValidators();
    } else {
      // Para gastos (EXPENSE), pueden tener proveedor
      this.transactionForm.get('supplierId')?.setValidators([]);
      this.transactionForm.get('customerId')?.clearValidators();
    }

    // Actualizar validaciones
    this.transactionForm.get('customerId')?.updateValueAndValidity();
    this.transactionForm.get('supplierId')?.updateValueAndValidity();
  }

  getCategoriesByType(): TransactionCategory[] {
    const type = this.transactionForm.get('type')?.value;
    return this.categories.filter(c => c.type === type);
  }

  getInvoicesByType(): any[] {
    const type = this.transactionForm.get('type')?.value;
    // Filtrar facturas seg�n el tipo de transacci�n
    return this.invoices.filter(invoice => {
      if (type === TransactionType.INCOME) {
        return invoice.type === 'SALE'; // Facturas de venta
      } else {
        return invoice.type === 'PURCHASE'; // Facturas de compra
      }
    });
  }

  getActiveVehicles(): Vehicle[] {
    return this.vehicles.filter(v => v.status === 'available' || v.status === 'in_use');
  }

  getActiveDrivers(): Driver[] {
    return this.drivers.filter(d => d.status === 'active');
  }

  getActiveCustomers(): Customer[] {
    return this.customers.filter(c => c.status === 'ACTIVE');
  }

  addTag(): void {
    if (this.newTagKey.trim() && this.newTagValue.trim()) {
      // Check if key already exists
      const existingTagIndex = this.tags.findIndex(t => t.key === this.newTagKey.trim());
      if (existingTagIndex >= 0) {
        // Update existing tag
        this.tags[existingTagIndex].value = this.newTagValue.trim();
      } else {
        // Add new tag
        this.tags.push({
          key: this.newTagKey.trim(),
          value: this.newTagValue.trim()
        });
      }
      this.newTagKey = '';
      this.newTagValue = '';
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = { ...this.transactionForm.value };

    // Convertir fecha string a Date
    formValue.date = new Date(formValue.date);

    // Convert tags array to object
    if (this.tags.length > 0) {
      formValue.tags = this.tags.reduce((acc, tag) => {
        acc[tag.key] = tag.value;
        return acc;
      }, {} as Record<string, any>);
    }

    // Limpiar campos opcionales vac�os
    Object.keys(formValue).forEach(key => {
      if (formValue[key] === '' || formValue[key] === null) {
        delete formValue[key];
      }
    });

    if (this.isEditMode && this.transactionId) {
      this.transactionService.updateTransaction(this.transactionId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/admin/accounting']);
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          alert('Error al actualizar la transacci�n');
          this.isLoading = false;
        }
      });
    } else {
      this.transactionService.createTransaction(formValue).subscribe({
        next: () => {
          this.router.navigate(['/admin/accounting']);
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          alert('Error al crear la transacci�n');
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/accounting']);
  }
}
