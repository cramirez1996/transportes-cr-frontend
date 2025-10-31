import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DocumentEntityType,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ENTITY_TYPE_LABELS,
  DOCUMENT_TYPES_WITH_EXPIRY,
} from '../../../../core/models/document.model';
import { DocumentService } from '../../../../core/services/document.service';
import { ModalRef } from '../../../../core/services/modal.service';
import { CustomerService } from '../../../../core/services/business/customer.service';
import { VehicleService } from '../../../../core/services/business/vehicle.service';
import { DriverService } from '../../../../core/services/business/driver.service';
import { TripService } from '../../../../core/services/trip.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { MaintenanceService } from '../../../../core/services/maintenance.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { UserService } from '../../../../core/services/user.service';
import { CustomSelectComponent, CustomSelectOption } from '../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent implements OnInit {
  private documentService = inject(DocumentService);
  private customerService = inject(CustomerService);
  private vehicleService = inject(VehicleService);
  private driverService = inject(DriverService);
  private tripService = inject(TripService);
  private invoiceService = inject(InvoiceService);
  private supplierService = inject(SupplierService);
  private maintenanceService = inject(MaintenanceService);
  private transactionService = inject(TransactionService);
  private userService = inject(UserService);

  // Modal ref passed automatically by ModalService
  @Input() modalRef?: ModalRef<boolean>;
  @Input() data?: any;

  // Form data
  selectedFile: File | null = null;
  entityType: DocumentEntityType | null = null;
  entityId = '';
  documentType: DocumentType | null = null;
  description = '';
  issueDate = '';
  expiryDate = '';
  loading = false;
  loadingEntities = false;

  // Available entities based on selected type
  availableEntities: any[] = [];
  
  // Custom select options
  tripOptions: CustomSelectOption[] = [];

  // Enums para el template
  DocumentEntityType = DocumentEntityType;
  DocumentType = DocumentType;
  documentTypeLabels = DOCUMENT_TYPE_LABELS;
  documentEntityTypeLabels = DOCUMENT_ENTITY_TYPE_LABELS;

  ngOnInit(): void {
    // Obtener datos del modal si existen
    if (this.data) {
      this.entityType = this.data.entityType || null;
      this.entityId = this.data.entityId || '';

      // Cargar entidades si ya hay un tipo seleccionado
      if (this.entityType) {
        this.loadEntitiesByType();
      }
    }
  }

  onEntityTypeChange(): void {
    // Limpiar entityId cuando cambia el tipo
    this.entityId = '';
    this.availableEntities = [];

    if (this.entityType) {
      this.loadEntitiesByType();
    }
  }

  private loadEntitiesByType(): void {
    if (!this.entityType) return;

    this.loadingEntities = true;

    switch (this.entityType) {
      case DocumentEntityType.CUSTOMER:
        this.customerService.getCustomers().subscribe({
          next: (customers) => {
            this.availableEntities = customers.map(c => ({
              id: c.id,
              label: `${c.businessName} - ${c.rut}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading customers:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.VEHICLE:
        this.vehicleService.getVehicles().subscribe({
          next: (vehicles) => {
            this.availableEntities = vehicles.map(v => ({
              id: v.id,
              label: `${v.licensePlate} - ${v.brand} ${v.model}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading vehicles:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.DRIVER:
        this.driverService.getDrivers().subscribe({
          next: (drivers) => {
            this.availableEntities = drivers.map(d => ({
              id: d.id,
              label: `${d.firstName} ${d.lastName} - ${d.rut}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading drivers:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.TRIP:
        this.tripService.getTrips({ page: 1, limit: 1000 }).subscribe({
          next: (response) => {
            this.availableEntities = response.data.map(t => ({
              id: t.id,
              label: `${t.origin} → ${t.destination} - ${t.departureDate.toLocaleDateString()}`
            }));
            this.tripOptions = response.data.map(t => ({
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
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading trips:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.INVOICE:
        this.invoiceService.getInvoices().subscribe({
          next: (response) => {
            this.availableEntities = response.data.map(i => ({
              id: i.id,
              label: `${i.documentType} ${i.folioNumber} - ${i.customer?.businessName || 'N/A'}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading invoices:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.SUPPLIER:
        this.supplierService.getSuppliers().subscribe({
          next: (suppliers) => {
            this.availableEntities = suppliers.map(s => ({
              id: s.id,
              label: `${s.businessName} - ${s.rut}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading suppliers:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.MAINTENANCE:
        this.maintenanceService.getMaintenanceRecords().subscribe({
          next: (records) => {
            this.availableEntities = records.map(m => ({
              id: m.id,
              label: `${m.vehicle?.licensePlate || 'N/A'} - ${m.maintenanceType?.name || 'N/A'} - ${m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : 'N/A'}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading maintenance records:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.TRANSACTION:
        this.transactionService.getTransactions().subscribe({
          next: (response) => {
            this.availableEntities = response.data.map((t: any) => ({
              id: t.id,
              label: `${t.type} - ${t.description} - $${t.amount}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading transactions:', err);
            this.loadingEntities = false;
          }
        });
        break;

      case DocumentEntityType.USER:
        this.userService.getUsers().subscribe({
          next: (response) => {
            this.availableEntities = response.data.map(u => ({
              id: u.id,
              label: `${u.firstName} ${u.lastName} - ${u.email}`
            }));
            this.loadingEntities = false;
          },
          error: (err) => {
            console.error('Error loading users:', err);
            this.loadingEntities = false;
          }
        });
        break;

      default:
        this.loadingEntities = false;
        break;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  canHaveExpiry(): boolean {
    if (!this.documentType) return false;
    return DOCUMENT_TYPES_WITH_EXPIRY.includes(this.documentType);
  }

  isFormValid(): boolean {
    return !!(
      this.selectedFile &&
      this.entityType &&
      this.entityId.trim() &&
      this.documentType
    );
  }

  onSubmit(): void {
    if (!this.isFormValid() || !this.selectedFile || !this.entityType || !this.documentType) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    this.loading = true;

    // Usar el servicio de upload
    this.documentService.uploadDocument(
      this.selectedFile,
      {
        entityType: this.entityType,
        entityId: this.entityId.trim(),
        documentType: this.documentType,
        description: this.description.trim() || undefined,
        issueDate: this.issueDate || undefined,
        expiryDate: this.expiryDate || undefined
      }
    ).subscribe({
      next: () => {
        alert('Documento subido exitosamente');
        if (this.modalRef) {
          this.modalRef.close(true);
        }
      },
      error: (err) => {
        console.error('Error al subir documento:', err);
        alert('Error al subir el documento. Esta funcionalidad aún no está implementada en el backend.');
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    if (this.modalRef) {
      this.modalRef.dismiss();
    }
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
