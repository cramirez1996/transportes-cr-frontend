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

interface EntityFolder {
  type: DocumentEntityType;
  label: string;
  count: number;
  color: {
    bg: string;
    bgHover: string;
    bgActive: string;
    border: string;
    borderActive: string;
    icon: string;
    iconActive: string;
    text: string;
    textActive: string;
    bar: string;
  };
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';

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
  recentDocuments: Document[] = [];
  loading = false;

  // View state
  viewMode: ViewMode = 'grid';
  currentFolder: DocumentEntityType | null = null;
  showFilters = false;
  sortBy: SortBy = 'date';

  // Entity folders
  entityFolders: EntityFolder[] = [];

  // Filters
  selectedDocumentType: DocumentType | 'all' = 'all';
  showOnlyExpiring = false;
  showOnlyExpired = false;
  showOnlyUnverified = false;
  searchTerm = '';
  dateFrom = '';
  dateTo = '';

  // Enums for template
  DocumentEntityType = DocumentEntityType;
  DocumentType = DocumentType;
  documentTypeLabels = DOCUMENT_TYPE_LABELS;
  documentEntityTypeLabels = DOCUMENT_ENTITY_TYPE_LABELS;

  // Helpers exposed for template
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
        this.calculateRecentDocuments();
        this.calculateEntityFolders();
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

  calculateRecentDocuments(): void {
    // Get most recently updated documents (top 10)
    this.recentDocuments = [...this.documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }

  calculateEntityFolders(): void {
    // Count documents per entity type
    const entityCounts = new Map<DocumentEntityType, number>();

    this.documents.forEach(doc => {
      const current = entityCounts.get(doc.entityType) || 0;
      entityCounts.set(doc.entityType, current + 1);
    });

    // Color palette for folders
    const colorPalette: Record<DocumentEntityType, {
      bg: string;
      bgHover: string;
      bgActive: string;
      border: string;
      borderActive: string;
      icon: string;
      iconActive: string;
      text: string;
      textActive: string;
      bar: string;
    }> = {
      [DocumentEntityType.CUSTOMER]: {
        bg: 'bg-blue-50',
        bgHover: 'hover:bg-blue-100',
        bgActive: 'bg-blue-100',
        border: 'border-blue-200',
        borderActive: 'border-blue-400',
        icon: 'text-blue-500',
        iconActive: 'text-blue-600',
        text: 'text-blue-900',
        textActive: 'text-blue-900',
        bar: 'bg-blue-500'
      },
      [DocumentEntityType.VEHICLE]: {
        bg: 'bg-purple-50',
        bgHover: 'hover:bg-purple-100',
        bgActive: 'bg-purple-100',
        border: 'border-purple-200',
        borderActive: 'border-purple-400',
        icon: 'text-purple-500',
        iconActive: 'text-purple-600',
        text: 'text-purple-900',
        textActive: 'text-purple-900',
        bar: 'bg-purple-500'
      },
      [DocumentEntityType.DRIVER]: {
        bg: 'bg-green-50',
        bgHover: 'hover:bg-green-100',
        bgActive: 'bg-green-100',
        border: 'border-green-200',
        borderActive: 'border-green-400',
        icon: 'text-green-500',
        iconActive: 'text-green-600',
        text: 'text-green-900',
        textActive: 'text-green-900',
        bar: 'bg-green-500'
      },
      [DocumentEntityType.TRIP]: {
        bg: 'bg-orange-50',
        bgHover: 'hover:bg-orange-100',
        bgActive: 'bg-orange-100',
        border: 'border-orange-200',
        borderActive: 'border-orange-400',
        icon: 'text-orange-500',
        iconActive: 'text-orange-600',
        text: 'text-orange-900',
        textActive: 'text-orange-900',
        bar: 'bg-orange-500'
      },
      [DocumentEntityType.INVOICE]: {
        bg: 'bg-rose-50',
        bgHover: 'hover:bg-rose-100',
        bgActive: 'bg-rose-100',
        border: 'border-rose-200',
        borderActive: 'border-rose-400',
        icon: 'text-rose-500',
        iconActive: 'text-rose-600',
        text: 'text-rose-900',
        textActive: 'text-rose-900',
        bar: 'bg-rose-500'
      },
      [DocumentEntityType.SUPPLIER]: {
        bg: 'bg-indigo-50',
        bgHover: 'hover:bg-indigo-100',
        bgActive: 'bg-indigo-100',
        border: 'border-indigo-200',
        borderActive: 'border-indigo-400',
        icon: 'text-indigo-500',
        iconActive: 'text-indigo-600',
        text: 'text-indigo-900',
        textActive: 'text-indigo-900',
        bar: 'bg-indigo-500'
      },
      [DocumentEntityType.USER]: {
        bg: 'bg-cyan-50',
        bgHover: 'hover:bg-cyan-100',
        bgActive: 'bg-cyan-100',
        border: 'border-cyan-200',
        borderActive: 'border-cyan-400',
        icon: 'text-cyan-600',
        iconActive: 'text-cyan-700',
        text: 'text-cyan-900',
        textActive: 'text-cyan-900',
        bar: 'bg-cyan-600'
      },
      [DocumentEntityType.TRANSACTION]: {
        bg: 'bg-amber-50',
        bgHover: 'hover:bg-amber-100',
        bgActive: 'bg-amber-100',
        border: 'border-amber-200',
        borderActive: 'border-amber-400',
        icon: 'text-amber-600',
        iconActive: 'text-amber-700',
        text: 'text-amber-900',
        textActive: 'text-amber-900',
        bar: 'bg-amber-600'
      },
      [DocumentEntityType.MAINTENANCE]: {
        bg: 'bg-teal-50',
        bgHover: 'hover:bg-teal-100',
        bgActive: 'bg-teal-100',
        border: 'border-teal-200',
        borderActive: 'border-teal-400',
        icon: 'text-teal-600',
        iconActive: 'text-teal-700',
        text: 'text-teal-900',
        textActive: 'text-teal-900',
        bar: 'bg-teal-600'
      }
    };

    // Create folder objects with colors
    this.entityFolders = Object.values(DocumentEntityType).map(entityType => ({
      type: entityType,
      label: this.documentEntityTypeLabels[entityType],
      count: entityCounts.get(entityType) || 0,
      color: colorPalette[entityType] || colorPalette[DocumentEntityType.CUSTOMER]
    }));
  }

  applyFilters(): void {
    let filtered = [...this.documents];

    // Filter by current folder (entity type)
    if (this.currentFolder) {
      filtered = filtered.filter(d => d.entityType === this.currentFolder);
    }

    // Filter by document type
    if (this.selectedDocumentType !== 'all') {
      filtered = filtered.filter(d => d.documentType === this.selectedDocumentType);
    }

    // Filter by expiring soon
    if (this.showOnlyExpiring) {
      filtered = filtered.filter(d => isDocumentExpiringSoon(d));
    }

    // Filter by expired
    if (this.showOnlyExpired) {
      filtered = filtered.filter(d => isDocumentExpired(d));
    }

    // Filter by unverified
    if (this.showOnlyUnverified) {
      filtered = filtered.filter(d => !d.isVerified);
    }

    // Filter by date range
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(d => {
        const docDate = d.issueDate ? new Date(d.issueDate) : new Date(d.createdAt);
        return docDate >= fromDate;
      });
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include end of day
      filtered = filtered.filter(d => {
        const docDate = d.issueDate ? new Date(d.issueDate) : new Date(d.createdAt);
        return docDate <= toDate;
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.originalName.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term) ||
        this.documentTypeLabels[d.documentType].toLowerCase().includes(term) ||
        this.documentEntityTypeLabels[d.entityType].toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered = this.sortDocuments(filtered);

    this.filteredDocuments = filtered;
  }

  sortDocuments(documents: Document[]): Document[] {
    const sorted = [...documents];

    switch (this.sortBy) {
      case 'name':
        sorted.sort((a, b) => a.originalName.localeCompare(b.originalName));
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'size':
        sorted.sort((a, b) => b.fileSize - a.fileSize);
        break;
      case 'type':
        sorted.sort((a, b) =>
          this.documentTypeLabels[a.documentType].localeCompare(this.documentTypeLabels[b.documentType])
        );
        break;
    }

    return sorted;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  openFolder(entityType: DocumentEntityType): void {
    this.currentFolder = entityType;
    this.applyFilters();
  }

  navigateToRoot(): void {
    this.currentFolder = null;
    this.clearFilters();
  }

  clearFilters(): void {
    this.selectedDocumentType = 'all';
    this.showOnlyExpiring = false;
    this.showOnlyExpired = false;
    this.showOnlyUnverified = false;
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedDocumentType !== 'all') count++;
    if (this.showOnlyExpiring) count++;
    if (this.showOnlyExpired) count++;
    if (this.showOnlyUnverified) count++;
    if (this.dateFrom) count++;
    if (this.dateTo) count++;
    return count;
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

  getVerifiedCount(): number {
    return this.documents.filter(d => d.isVerified).length;
  }

  getStoragePercentage(): number {
    // Simulate a max storage of 100GB for display purposes
    const maxStorageBytes = 100 * 1024 * 1024 * 1024; // 100 GB
    const totalBytes = this.documents.reduce((sum, d) => sum + d.fileSize, 0);
    const percentage = (totalBytes / maxStorageBytes) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }

  getFolderPercentage(folderCount: number): number {
    if (this.documents.length === 0) return 0;
    return (folderCount / this.documents.length) * 100;
  }

  getFolderClasses(folder: EntityFolder): string {
    const baseClasses = 'w-full flex items-center justify-between p-3 rounded-lg border transition-all group';
    const isActive = this.currentFolder === folder.type;

    if (isActive) {
      return `${baseClasses} ${folder.color.bgActive} ${folder.color.borderActive}`;
    }
    return `${baseClasses} ${folder.color.bg} ${folder.color.border} ${folder.color.bgHover}`;
  }

  getFolderIconClasses(folder: EntityFolder): string {
    const isActive = this.currentFolder === folder.type;
    return isActive ? `w-8 h-8 ${folder.color.iconActive}` : `w-8 h-8 ${folder.color.icon}`;
  }

  getFolderTextClasses(folder: EntityFolder): string {
    const isActive = this.currentFolder === folder.type;
    return isActive ? `text-sm font-medium ${folder.color.textActive}` : `text-sm font-medium ${folder.color.text}`;
  }

  getFolderBarClasses(folder: EntityFolder): string {
    return `h-1.5 rounded-full ${folder.color.bar}`;
  }
}
