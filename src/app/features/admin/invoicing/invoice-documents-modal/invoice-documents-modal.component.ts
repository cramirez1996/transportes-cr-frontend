import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Document,
  DocumentEntityType,
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  isDocumentExpired,
  isDocumentExpiringSoon,
} from '../../../../core/models/document.model';
import { DocumentService } from '../../../../core/services/document.service';
import { ModalRef } from '../../../../core/services/modal.service';

interface InvoiceDocumentsModalData {
  invoiceId: string;
  invoiceFolio: string;
}

@Component({
  selector: 'app-invoice-documents-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-documents-modal.component.html',
  styleUrls: ['./invoice-documents-modal.component.scss']
})
export class InvoiceDocumentsModalComponent implements OnInit {
  private documentService = inject(DocumentService);

  // Injected by ModalService
  modalRef!: ModalRef;
  data!: InvoiceDocumentsModalData;

  invoiceId: string = '';
  invoiceFolio: string = '';

  documents: Document[] = [];
  loading = false;
  error: string | null = null;

  // File preview
  previewUrl: string | null = null;
  selectedDocument: Document | null = null;
  showPreview = false;

  // Expose helpers for template
  formatFileSize = formatFileSize;
  isDocumentExpired = isDocumentExpired;
  isDocumentExpiringSoon = isDocumentExpiringSoon;
  documentTypeLabels = DOCUMENT_TYPE_LABELS;

  ngOnInit(): void {
    if (this.data) {
      this.invoiceId = this.data.invoiceId;
      this.invoiceFolio = this.data.invoiceFolio;
      this.loadDocuments();
    }
  }

  close(): void {
    this.modalRef.close();
  }

  loadDocuments(): void {
    if (!this.invoiceId) return;

    this.loading = true;
    this.error = null;

    this.documentService.getDocumentsByEntity(DocumentEntityType.INVOICE, this.invoiceId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar documentos:', err);
        this.error = 'Error al cargar los documentos de la factura';
        this.loading = false;
      }
    });
  }

  viewDocument(document: Document): void {
    this.selectedDocument = document;
    this.showPreview = true;

    this.documentService.getDownloadUrl(document.id).subscribe({
      next: (response) => {
        this.previewUrl = response.url;
      },
      error: (err) => {
        console.error('Error al obtener URL de previsualización:', err);
        this.error = 'Error al cargar la previsualización del documento';
        this.previewUrl = null;
      }
    });
  }

  closePreview(): void {
    this.showPreview = false;
    this.selectedDocument = null;
    this.previewUrl = null;
  }

  downloadDocument(document: Document): void {
    this.documentService.getDownloadUrl(document.id).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (err) => {
        console.error('Error al descargar documento:', err);
        this.error = 'Error al descargar el documento';
      }
    });
  }

  deleteDocument(document: Document): void {
    if (!confirm(`¿Estás seguro de eliminar el documento "${document.originalName}"?`)) {
      return;
    }

    this.documentService.deleteDocument(document.id).subscribe({
      next: () => {
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Error al eliminar documento:', err);
        this.error = 'Error al eliminar el documento';
      }
    });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    if (mimeType === 'application/pdf') return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getFileIconColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'text-green-500';
    if (mimeType === 'application/pdf') return 'text-red-500';
    return 'text-blue-500';
  }

  canPreview(mimeType: string): boolean {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
  }
}
