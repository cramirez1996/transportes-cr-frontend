import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Document,
  DocumentEntityType,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  getDocumentIcon,
  isDocumentExpired,
  isDocumentExpiringSoon,
} from '../../../core/models/document.model';
import { DocumentService } from '../../../core/services/document.service';
import { ModalService } from '../../../core/services/modal.service';
import { DocumentUploadComponent } from '../../../features/admin/documents/document-upload/document-upload.component';

@Component({
  selector: 'app-entity-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entity-documents.component.html',
  styleUrl: './entity-documents.component.scss'
})
export class EntityDocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private modalService = inject(ModalService);

  @Input() entityType!: DocumentEntityType;
  @Input() entityId!: string;
  @Input() showTitle = true;
  @Input() allowUpload = true;
  @Input() allowDelete = true;

  documents: Document[] = [];
  loading = false;

  // Enums para el template
  documentTypeLabels = DOCUMENT_TYPE_LABELS;

  // Helpers expuestos para el template
  formatFileSize = formatFileSize;
  getDocumentIcon = getDocumentIcon;
  isDocumentExpired = isDocumentExpired;
  isDocumentExpiringSoon = isDocumentExpiringSoon;

  ngOnInit(): void {
    if (!this.entityType || !this.entityId) {
      console.error('EntityDocumentsComponent: entityType and entityId are required');
      return;
    }
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.documentService.getDocuments({
      entityType: this.entityType,
      entityId: this.entityId
    }).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar documentos:', err);
        this.loading = false;
      }
    });
  }

  openUploadModal(): void {
    const modalRef = this.modalService.open(DocumentUploadComponent, {
      title: 'Subir Documento',
      data: {
        entityType: this.entityType,
        entityId: this.entityId
      }
    });

    modalRef.result
      .then((result) => {
        if (result) {
          this.loadDocuments();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  downloadDocument(document: Document): void {
    this.documentService.getDownloadUrl(document.id).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (err) => {
        console.error('Error al obtener URL de descarga:', err);
        alert('Error al descargar el documento. Esta funcionalidad aún no está implementada en el backend.');
      }
    });
  }

  deleteDocument(document: Document): void {
    if (confirm(`¿Está seguro de eliminar el documento "${document.originalName}"?`)) {
      this.documentService.deleteDocument(document.id).subscribe({
        next: () => {
          alert('Documento eliminado exitosamente');
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Error al eliminar documento:', err);
          alert('Error al eliminar el documento.');
        }
      });
    }
  }

  verifyDocument(document: Document): void {
    const action = document.isVerified ? 'desverificar' : 'verificar';
    this.documentService.verifyDocument(document.id, { isVerified: !document.isVerified }).subscribe({
      next: () => {
        this.loadDocuments();
      },
      error: (err) => {
        console.error(`Error al ${action} documento:`, err);
        alert(`Error al ${action} el documento.`);
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getExpiryBadgeClass(document: Document): string {
    if (!document.expiryDate) return '';
    if (isDocumentExpired(document)) return 'bg-red-100 text-red-800';
    if (isDocumentExpiringSoon(document)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getExpiryLabel(document: Document): string {
    if (!document.expiryDate) return '';
    if (isDocumentExpired(document)) return 'Vencido';
    if (isDocumentExpiringSoon(document)) return 'Próximo a vencer';
    return 'Vigente';
  }

  getDocumentTypeIcon(documentType: DocumentType): string {
    const icons: Record<DocumentType, string> = {
      [DocumentType.INVOICE]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      [DocumentType.DELIVERY_PROOF]: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      [DocumentType.PACKING_LIST]: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      [DocumentType.QUOTE]: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
      [DocumentType.CONTRACT]: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      [DocumentType.LICENSE]: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
      [DocumentType.INSURANCE]: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      [DocumentType.TECHNICAL_REVIEW]: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      [DocumentType.PERMIT]: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      [DocumentType.ID_CARD]: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
      [DocumentType.RECEIPT]: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      [DocumentType.OTHER]: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    };
    return icons[documentType];
  }
}
