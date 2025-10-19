import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Document,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_ENTITY_TYPE_LABELS,
  formatFileSize,
  getDocumentIcon,
  isDocumentExpired,
  isDocumentExpiringSoon,
} from '../../../../core/models/document.model';
import { DocumentService } from '../../../../core/services/document.service';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss'
})
export class DocumentDetailComponent implements OnInit {
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  document: Document | null = null;
  loading = false;

  documentTypeLabels = DOCUMENT_TYPE_LABELS;
  documentEntityTypeLabels = DOCUMENT_ENTITY_TYPE_LABELS;
  formatFileSize = formatFileSize;
  getDocumentIcon = getDocumentIcon;
  isDocumentExpired = isDocumentExpired;
  isDocumentExpiringSoon = isDocumentExpiringSoon;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocument(id);
    }
  }

  loadDocument(id: string): void {
    this.loading = true;
    this.documentService.getDocumentById(id).subscribe({
      next: (document) => {
        this.document = document;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar documento:', err);
        alert('Error al cargar el documento. Por favor, intente nuevamente.');
        this.router.navigate(['/admin/documents']);
        this.loading = false;
      }
    });
  }

  downloadDocument(): void {
    if (!this.document) return;

    this.documentService.getDownloadUrl(this.document.id).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (err) => {
        console.error('Error al obtener URL de descarga:', err);
        alert('Error al descargar el documento. Esta funcionalidad aún no está implementada en el backend.');
      }
    });
  }

  verifyDocument(): void {
    if (!this.document) return;

    const action = this.document.isVerified ? 'desverificar' : 'verificar';
    if (confirm(`¿Está seguro de ${action} el documento "${this.document.originalName}"?`)) {
      this.documentService.verifyDocument(this.document.id, { isVerified: !this.document.isVerified }).subscribe({
        next: () => {
          alert(`Documento ${action === 'verificar' ? 'verificado' : 'desverificado'} exitosamente`);
          if (this.document) {
            this.loadDocument(this.document.id);
          }
        },
        error: (err) => {
          console.error(`Error al ${action} documento:`, err);
          alert(`Error al ${action} el documento. Por favor, intente nuevamente.`);
        }
      });
    }
  }

  deleteDocument(): void {
    if (!this.document) return;

    if (confirm(`¿Está seguro de eliminar el documento "${this.document.originalName}"?`)) {
      this.documentService.deleteDocument(this.document.id).subscribe({
        next: () => {
          alert('Documento eliminado exitosamente');
          this.router.navigate(['/admin/documents']);
        },
        error: (err) => {
          console.error('Error al eliminar documento:', err);
          alert('Error al eliminar el documento. Por favor, intente nuevamente.');
        }
      });
    }
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

  getExpiryBadgeClass(): string {
    if (!this.document || !this.document.expiryDate) return '';
    if (isDocumentExpired(this.document)) return 'bg-red-100 text-red-800';
    if (isDocumentExpiringSoon(this.document)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getExpiryLabel(): string {
    if (!this.document || !this.document.expiryDate) return '';
    if (isDocumentExpired(this.document)) return 'Vencido';
    if (isDocumentExpiringSoon(this.document)) return 'Próximo a vencer';
    return 'Vigente';
  }

  getUploaderName(): string {
    if (!this.document || !this.document.uploader) return 'Desconocido';
    return `${this.document.uploader.firstName} ${this.document.uploader.lastName}`;
  }

  getVerifierName(): string {
    if (!this.document || !this.document.verifier) return '-';
    return `${this.document.verifier.firstName} ${this.document.verifier.lastName}`;
  }

  goBack(): void {
    this.router.navigate(['/admin/documents']);
  }
}
