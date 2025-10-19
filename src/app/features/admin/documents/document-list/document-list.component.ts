import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Document,
  DocumentEntityType,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ENTITY_TYPE_LABELS,
  formatFileSize,
  getDocumentIcon,
  isDocumentExpired,
  isDocumentExpiringSoon,
} from '../../../../core/models/document.model';
import { DocumentService } from '../../../../core/services/document.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private modalService = inject(ModalService);

  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  loading = false;

  // Filtros
  selectedEntityType: DocumentEntityType | 'all' = 'all';
  selectedDocumentType: DocumentType | 'all' = 'all';
  showOnlyExpiring = false;
  showOnlyExpired = false;
  showOnlyUnverified = false;
  searchTerm = '';

  // Enums para el template
  DocumentEntityType = DocumentEntityType;
  DocumentType = DocumentType;
  documentTypeLabels = DOCUMENT_TYPE_LABELS;
  documentEntityTypeLabels = DOCUMENT_ENTITY_TYPE_LABELS;

  // Helpers expuestos para el template
  formatFileSize = formatFileSize;
  getDocumentIcon = getDocumentIcon;
  isDocumentExpired = isDocumentExpired;
  isDocumentExpiringSoon = isDocumentExpiringSoon;

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.documentService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar documentos:', err);
        alert('Error al cargar los documentos. Por favor, intente nuevamente.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.documents];

    // Filtro por tipo de entidad
    if (this.selectedEntityType !== 'all') {
      filtered = filtered.filter(d => d.entityType === this.selectedEntityType);
    }

    // Filtro por tipo de documento
    if (this.selectedDocumentType !== 'all') {
      filtered = filtered.filter(d => d.documentType === this.selectedDocumentType);
    }

    // Filtro por próximos a vencer
    if (this.showOnlyExpiring) {
      filtered = filtered.filter(d => isDocumentExpiringSoon(d));
    }

    // Filtro por vencidos
    if (this.showOnlyExpired) {
      filtered = filtered.filter(d => isDocumentExpired(d));
    }

    // Filtro por no verificados
    if (this.showOnlyUnverified) {
      filtered = filtered.filter(d => !d.isVerified);
    }

    // Búsqueda por texto
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.originalName.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term) ||
        this.documentTypeLabels[d.documentType].toLowerCase().includes(term) ||
        this.documentEntityTypeLabels[d.entityType].toLowerCase().includes(term)
      );
    }

    this.filteredDocuments = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openUploadModal(): void {
    const modalRef = this.modalService.open(DocumentUploadComponent, {
      title: 'Subir Documento'
    });

    modalRef.result
      .then(() => {
        this.loadDocuments();
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  verifyDocument(document: Document): void {
    const action = document.isVerified ? 'desverificar' : 'verificar';
    if (confirm(`¿Está seguro de ${action} el documento "${document.originalName}"?`)) {
      this.documentService.verifyDocument(document.id, { isVerified: !document.isVerified }).subscribe({
        next: () => {
          alert(`Documento ${action === 'verificar' ? 'verificado' : 'desverificado'} exitosamente`);
          this.loadDocuments();
        },
        error: (err) => {
          console.error(`Error al ${action} documento:`, err);
          alert(`Error al ${action} el documento. Por favor, intente nuevamente.`);
        }
      });
    }
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
          alert('Error al eliminar el documento. Por favor, intente nuevamente.');
        }
      });
    }
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

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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

  getUploaderName(document: Document): string {
    if (!document.uploader) return 'Desconocido';
    return `${document.uploader.firstName} ${document.uploader.lastName}`;
  }

  getVerifierName(document: Document): string {
    if (!document.verifier) return '-';
    return `${document.verifier.firstName} ${document.verifier.lastName}`;
  }

  // Contadores para estadísticas
  getTotalDocuments(): number {
    return this.documents.length;
  }

  getExpiringCount(): number {
    return this.documents.filter(d => isDocumentExpiringSoon(d)).length;
  }

  getExpiredCount(): number {
    return this.documents.filter(d => isDocumentExpired(d)).length;
  }

  getUnverifiedCount(): number {
    return this.documents.filter(d => !d.isVerified).length;
  }

  getTotalSize(): string {
    const totalBytes = this.documents.reduce((sum, d) => sum + d.fileSize, 0);
    return formatFileSize(totalBytes);
  }
}
