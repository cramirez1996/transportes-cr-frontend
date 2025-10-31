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
import { TripGroupService } from '../../../../core/services/trip-group.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Customer } from '../../../../core/models/business/customer.model';
import { Vehicle } from '../../../../core/models/business/vehicle.model';
import { Driver } from '../../../../core/models/business/driver.model';
import { Supplier } from '../../../../core/models/trip.model';
import { TripGroup } from '../../../../core/models/trip-group.model';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, CustomSelectComponent],
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
  private tripGroupService = inject(TripGroupService);
  private invoiceService = inject(InvoiceService);
  private supplierService = inject(SupplierService);

  transactionForm!: FormGroup;
  isEditMode = false;
  transactionId: string | null = null;
  isLoading = false;

  // Nueva propiedad para controlar el tipo de asociación
  associationType: 'trip' | 'tripGroup' | 'none' = 'none';

  // Datos para selects
  categories: TransactionCategory[] = [];
  customers: Customer[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  trips: any[] = [];
  tripGroups: TripGroup[] = [];
  invoices: any[] = [];
  suppliers: Supplier[] = [];

  // Enums para template
  TransactionType = TransactionType;
  PaymentMethod = PaymentMethod;

  // Options for custom-select components
  typeOptions: CustomSelectOption[] = [
    { value: TransactionType.INCOME, label: 'Ingreso' },
    { value: TransactionType.EXPENSE, label: 'Gasto' }
  ];
  
  paymentMethodOptions: CustomSelectOption[] = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethod.CARD, label: 'Tarjeta' },
    { value: PaymentMethod.CHECK, label: 'Cheque' }
  ];

  categoryOptions: CustomSelectOption[] = [];
  customerOptions: CustomSelectOption[] = [];
  vehicleOptions: CustomSelectOption[] = [];
  driverOptions: CustomSelectOption[] = [];
  tripOptions: CustomSelectOption[] = [];
  tripGroupOptions: CustomSelectOption[] = [];
  invoiceOptions: CustomSelectOption[] = [];
  supplierOptions: CustomSelectOption[] = [];

  // Tags management
  tags: { key: string; value: string }[] = [];
  newTagKey = '';
  newTagValue = '';

  ngOnInit(): void {
    this.initForm();
    
    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      this.isEditMode = true;
    }

    // Load related data first, then load transaction if in edit mode
    this.loadRelatedData();

    // Suscribirse a cambios de tipo para validaciones
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.applyBusinessRules();
    });
  }

  initForm(): void {
    this.transactionForm = this.fb.group({
      type: [TransactionType.EXPENSE, Validators.required],
      categoryId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      paymentMethod: [PaymentMethod.CASH, Validators.required],
      referenceNumber: [null],
      invoiceId: [null],
      tripId: [null],
      tripGroupId: [null], // Nuevo campo para vuelta
      vehicleId: [null],
      driverId: [null],
      customerId: [null],
      supplierId: [null]
    });
  }

  loadRelatedData(): void {
    this.isLoading = true;

    forkJoin({
      categories: this.transactionService.getCategories(),
      customers: this.customerService.getCustomers(),
      vehicles: this.vehicleService.getVehicles(),
      drivers: this.driverService.getDrivers(),
      trips: this.tripService.getTrips({ page: 1, limit: 1000 }),
      tripGroups: this.tripGroupService.getAll(),
      invoices: this.invoiceService.getInvoices({}, { page: 1, limit: 1000 }),
      suppliers: this.supplierService.getSuppliers()
    }).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.customers = data.customers;
        this.vehicles = data.vehicles;
        this.drivers = data.drivers;
        this.trips = data.trips.data;
        this.tripGroups = data.tripGroups.filter(tg =>
          tg.status === 'PENDING' || tg.status === 'IN_PROGRESS'
        );
        this.invoices = data.invoices.data;
        this.suppliers = data.suppliers;

        // Build custom-select options
        this.buildSelectOptions();
        
        // Load transaction AFTER options are built
        if (this.isEditMode && this.transactionId) {
          this.loadTransaction(this.transactionId);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading related data:', error);
        this.isLoading = false;
      }
    });
  }

  buildSelectOptions(): void {
    // Build category options (filtered by type will be done in getCategoriesByType)
    this.categoryOptions = this.categories.map(c => ({
      value: c.id,
      label: c.name
    }));

    // Build customer options
    this.customerOptions = this.customers
      .filter(c => c.status === 'ACTIVE')
      .map(c => ({
        value: c.id,
        label: c.businessName,
        data: {
          rut: c.rut,
          avatar: this.getInitials(c.businessName)
        }
      }));

    // Build supplier options
    this.supplierOptions = this.suppliers.map(s => ({
      value: s.id,
      label: s.businessName,
      data: {
        rut: s.rut,
        avatar: this.getInitials(s.businessName)
      }
    }));

    // Build vehicle options
    this.vehicleOptions = this.vehicles
      .filter(v => v.status === 'available' || v.status === 'in_use')
      .map(v => ({
        value: v.id,
        label: `${v.licensePlate} - ${v.brand} ${v.model}`,
        data: {
          licensePlate: v.licensePlate,
          brand: v.brand,
          model: v.model
        }
      }));

    // Build driver options
    this.driverOptions = this.drivers
      .filter(d => d.status === 'active')
      .map(d => ({
        value: d.id,
        label: `${d.firstName} ${d.lastName}`,
        data: {
          licenseNumber: d.licenseNumber,
          avatar: this.getInitials(`${d.firstName} ${d.lastName}`)
        }
      }));

    // Build trip options
    this.tripOptions = this.trips.map(t => ({
      value: t.id,
      label: `${t.origin} → ${t.destination}`,
      searchableText: `${t.id} ${t.origin} ${t.destination}`,
      data: {
        id: t.id,
        origin: t.origin,
        destination: t.destination,
        departureDate: t.departureDate
      }
    }));

    // Build trip group options
    this.tripGroupOptions = this.tripGroups.map(tg => ({
      value: tg.id,
      label: tg.code,
      data: {
        description: tg.description,
        startDate: tg.startDate,
        status: tg.status,
        tripCount: tg.tripCount
      }
    }));

    // Build invoice options
    this.invoiceOptions = this.invoices.map(inv => ({
      value: inv.id,
      label: `${inv.folioNumber} - $${this.formatCurrency(inv.totalAmount)}`,
      searchableText: `${inv.folioNumber} ${inv.customer?.businessName || ''} ${inv.supplier?.businessName || ''} ${inv.totalAmount}`,
      data: {
        type: inv.type,
        folioNumber: inv.folioNumber,
        totalAmount: inv.totalAmount,
        issueDate: inv.issueDate,
        customerName: inv.customer?.businessName,
        supplierName: inv.supplier?.businessName,
        customerRut: inv.customer?.rut,
        supplierRut: inv.supplier?.rut
      }
    }));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  loadTransaction(id: string): void {
    this.transactionService.getTransactionById(id).subscribe({
      next: (transaction: any) => {
        this.transactionForm.patchValue({
          type: transaction.type,
          categoryId: transaction.category?.id || null,
          amount: transaction.amount,
          date: new Date(transaction.date).toISOString().split('T')[0],
          description: transaction.description,
          paymentMethod: transaction.paymentMethod,
          referenceNumber: transaction.referenceNumber || null,
          invoiceId: transaction.invoice?.id || null,
          tripId: transaction.trip?.id || null,
          tripGroupId: transaction.tripGroup?.id || null,
          vehicleId: transaction.vehicle?.id || null,
          driverId: transaction.driver?.id || null,
          customerId: transaction.customer?.id || null,
          supplierId: transaction.supplier?.id || null
        });

        // Set association type based on loaded data
        if (transaction.tripGroup?.id) {
          this.associationType = 'tripGroup';
        } else if (transaction.trip?.id) {
          this.associationType = 'trip';
        } else {
          this.associationType = 'none';
        }

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

  onAssociationTypeChange(type: 'trip' | 'tripGroup' | 'none'): void {
    this.associationType = type;

    // Clear opposite field to maintain exclusivity
    if (type === 'trip') {
      this.transactionForm.patchValue({ tripGroupId: null });
    } else if (type === 'tripGroup') {
      this.transactionForm.patchValue({ tripId: null });
    } else {
      this.transactionForm.patchValue({ tripId: null, tripGroupId: null });
    }
  }

  /**
   * Reglas de negocio según la documentación:
   * - INCOME (Ingresos): Generalmente asociados a clientes y facturas de venta
   * - EXPENSE (Gastos): Pueden asociarse a proveedores, facturas de compra, viajes, vehículos, conductores
   */
  applyBusinessRules(): void {
    const type = this.transactionForm.get('type')?.value;

    if (type === TransactionType.INCOME) {
      // Para ingresos, es común tener cliente
      // Los gastos de viaje/vehículo/conductor son menos relevantes para ingresos
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

  getCategoriesByType(): CustomSelectOption[] {
    const type = this.transactionForm.get('type')?.value;
    return this.categoryOptions.filter(opt => {
      const category = this.categories.find(c => c.id === opt.value);
      return category?.type === type;
    });
  }

  getInvoicesByType(): CustomSelectOption[] {
    const type = this.transactionForm.get('type')?.value;
    // Filtrar facturas según el tipo de transacción
    return this.invoiceOptions.filter(opt => {
      if (type === TransactionType.INCOME) {
        return opt.data.type === 'SALE'; // Facturas de venta
      } else {
        return opt.data.type === 'PURCHASE'; // Facturas de compra
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

    // Limpiar campos opcionales vacíos
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
          alert('Error al actualizar la transacción');
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
          alert('Error al crear la transacción');
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/accounting']);
  }
}
