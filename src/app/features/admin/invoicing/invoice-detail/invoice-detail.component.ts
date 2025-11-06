import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice, InvoiceStatus, InvoiceType } from '../../../../core/models/invoice.model';
import { InvoiceDocumentsModalComponent } from '../invoice-documents-modal/invoice-documents-modal.component';
import { ModalService } from '../../../../core/services/modal.service';
import { DocumentService } from '../../../../core/services/document.service';
import { DocumentEntityType, DocumentType, DOCUMENT_TYPE_LABELS } from '../../../../core/models/document.model';
import { DateOnlyPipe } from '../../../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-invoice-detail',
  imports: [CommonModule, RouterModule, FormsModule, DateOnlyPipe],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss'
})
export class InvoiceDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private modalService = inject(ModalService);
  private documentService = inject(DocumentService);

  invoice: Invoice | null = null;
  loading = false;
  error: string | null = null;
  
  // Credit notes
  creditNotes: Invoice[] = [];
  loadingCreditNotes = false;

  // Document upload
  selectedFile: File | null = null;
  documentType: DocumentType = DocumentType.INVOICE;
  description: string = '';
  issueDate: string = '';
  expiryDate: string = '';
  uploading = false;
  uploadError: string | null = null;
  uploadSuccess: string | null = null;

  InvoiceStatus = InvoiceStatus;
  InvoiceType = InvoiceType;
  DocumentType = DocumentType;
  documentTypeLabels = DOCUMENT_TYPE_LABELS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInvoice(id);
    }
  }

  loadInvoice(id: string): void {
    this.loading = true;
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loading = false;
        
        // Load credit notes if this is not a credit note itself
        if (invoice.documentType !== 61) {
          this.loadCreditNotes(id);
        }
      },
      error: (err) => {
        this.error = 'Error al cargar la factura';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadCreditNotes(invoiceId: string): void {
    this.loadingCreditNotes = true;
    this.invoiceService.getCreditNotes(invoiceId).subscribe({
      next: (notes) => {
        this.creditNotes = notes;
        this.loadingCreditNotes = false;
      },
      error: (err) => {
        console.error('Error al cargar notas de crédito:', err);
        this.loadingCreditNotes = false;
      }
    });
  }

  getTotalCredited(): number {
    return this.creditNotes.reduce((sum, note) => sum + note.totalAmount, 0);
  }

  getNetAmount(): number {
    if (!this.invoice) return 0;
    return this.invoice.totalAmount - this.getTotalCredited();
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Anulada',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'Creditada Parcial',
      [InvoiceStatus.FULLY_CREDITED]: 'Creditada Total'
    };
    return labels[status];
  }

  getStatusClass(status: InvoiceStatus): string {
    const classes = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'bg-yellow-100 text-yellow-800',
      [InvoiceStatus.FULLY_CREDITED]: 'bg-orange-100 text-orange-800'
    };
    return classes[status];
  }

  goBack(): void {
    this.router.navigate(['/admin/invoicing']);
  }

  openDocumentsModal(): void {
    if (this.invoice) {
      this.modalService.open(InvoiceDocumentsModalComponent, {
        title: 'Documentos de Factura',
        data: {
          invoiceId: this.invoice.id,
          invoiceFolio: this.invoice.folioNumber
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = null;
      this.uploadSuccess = null;
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Por favor, selecciona un archivo';
      return;
    }

    if (!this.invoice) {
      this.uploadError = 'No se pudo identificar la factura';
      return;
    }

    this.uploading = true;
    this.uploadError = null;
    this.uploadSuccess = null;

    const uploadData = {
      entityType: DocumentEntityType.INVOICE,
      entityId: this.invoice.id,
      documentType: this.documentType,
      description: this.description || undefined,
      issueDate: this.issueDate || undefined,
      expiryDate: this.expiryDate || undefined,
    };

    this.documentService.uploadDocument(this.selectedFile, uploadData).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadSuccess = 'Documento subido exitosamente';
        this.resetUploadForm();

        // Reset file input
        const fileInput = document.getElementById('documentFileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.uploadSuccess = null;
        }, 3000);
      },
      error: (err) => {
        console.error('Error al subir documento:', err);
        this.uploadError = err.error?.message || 'Error al subir el documento';
        this.uploading = false;
      }
    });
  }

  resetUploadForm(): void {
    this.selectedFile = null;
    this.documentType = DocumentType.INVOICE;
    this.description = '';
    this.issueDate = '';
    this.expiryDate = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
