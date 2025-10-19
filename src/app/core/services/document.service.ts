import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  VerifyDocumentDto,
  DocumentFilterDto,
  DocumentStats,
  DocumentEntityType,
} from '../models/document.model';
import { environment } from '../../../environments/environment';

interface DocumentBackendResponse {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedBy: string;
  uploader?: any;
  isVerified: boolean;
  verifiedBy?: string;
  verifier?: any;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/documents`;

  /**
   * Get all documents with optional filters
   */
  getDocuments(filters?: DocumentFilterDto): Observable<Document[]> {
    let params = new HttpParams();

    if (filters?.entityType) {
      params = params.set('entityType', filters.entityType);
    }
    if (filters?.entityId) {
      params = params.set('entityId', filters.entityId);
    }
    if (filters?.documentType) {
      params = params.set('documentType', filters.documentType);
    }
    if (filters?.expiringBefore) {
      params = params.set('expiringBefore', filters.expiringBefore);
    }
    if (filters?.expiringAfter) {
      params = params.set('expiringAfter', filters.expiringAfter);
    }

    return this.http.get<DocumentBackendResponse[]>(this.apiUrl, { params }).pipe(
      map(documents => documents.map(doc => this.mapDocumentFromBackend(doc)))
    );
  }

  /**
   * Get a single document by ID
   */
  getDocumentById(id: string): Observable<Document> {
    return this.http.get<DocumentBackendResponse>(`${this.apiUrl}/${id}`).pipe(
      map(doc => this.mapDocumentFromBackend(doc))
    );
  }

  /**
   * Get all documents for a specific entity
   */
  getDocumentsByEntity(entityType: DocumentEntityType, entityId: string): Observable<Document[]> {
    return this.http.get<DocumentBackendResponse[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`).pipe(
      map(documents => documents.map(doc => this.mapDocumentFromBackend(doc)))
    );
  }

  /**
   * Get documents expiring within the specified days
   */
  getExpiringDocuments(days: number = 30): Observable<Document[]> {
    return this.http.get<DocumentBackendResponse[]>(`${this.apiUrl}/expiring?days=${days}`).pipe(
      map(documents => documents.map(doc => this.mapDocumentFromBackend(doc)))
    );
  }

  /**
   * Get expired documents
   */
  getExpiredDocuments(): Observable<Document[]> {
    return this.http.get<DocumentBackendResponse[]>(`${this.apiUrl}/expired`).pipe(
      map(documents => documents.map(doc => this.mapDocumentFromBackend(doc)))
    );
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): Observable<DocumentStats> {
    return this.http.get<DocumentStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Create a document record
   * Note: This creates the database record. File upload should be done separately.
   */
  createDocument(documentData: CreateDocumentDto): Observable<Document> {
    return this.http.post<DocumentBackendResponse>(this.apiUrl, documentData).pipe(
      map(doc => this.mapDocumentFromBackend(doc))
    );
  }

  /**
   * Update document metadata
   */
  updateDocument(id: string, documentData: UpdateDocumentDto): Observable<Document> {
    return this.http.patch<DocumentBackendResponse>(`${this.apiUrl}/${id}`, documentData).pipe(
      map(doc => this.mapDocumentFromBackend(doc))
    );
  }

  /**
   * Verify or unverify a document
   */
  verifyDocument(id: string, verifyData: VerifyDocumentDto): Observable<Document> {
    return this.http.patch<DocumentBackendResponse>(`${this.apiUrl}/${id}/verify`, verifyData).pipe(
      map(doc => this.mapDocumentFromBackend(doc))
    );
  }

  /**
   * Soft delete a document
   */
  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Upload a file and create document record
   * This method combines file upload with document creation
   */
  uploadDocument(
    file: File,
    entityType: DocumentEntityType,
    entityId: string,
    documentType: string,
    description?: string,
    issueDate?: string,
    expiryDate?: string
  ): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('documentType', documentType);

    if (description) {
      formData.append('description', description);
    }
    if (issueDate) {
      formData.append('issueDate', issueDate);
    }
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    // TODO: Update this endpoint when file upload is implemented on backend
    return this.http.post<DocumentBackendResponse>(`${this.apiUrl}/upload`, formData).pipe(
      map(doc => this.mapDocumentFromBackend(doc))
    );
  }

  /**
   * Download a document
   * Returns a signed URL for downloading the file from S3
   */
  getDownloadUrl(id: string): Observable<{ url: string }> {
    // TODO: Update this endpoint when download is implemented on backend
    return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/download`);
  }

  /**
   * Get a preview URL for a document
   * Returns a signed URL for previewing the file
   */
  getPreviewUrl(id: string): Observable<{ url: string }> {
    // TODO: Update this endpoint when preview is implemented on backend
    return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/preview`);
  }

  // Mapper: Backend -> Frontend
  private mapDocumentFromBackend(doc: DocumentBackendResponse): Document {
    return {
      id: doc.id,
      entityType: doc.entityType as any,
      entityId: doc.entityId,
      fileName: doc.fileName,
      originalName: doc.originalName,
      s3Key: doc.s3Key,
      s3Bucket: doc.s3Bucket,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: doc.documentType as any,
      description: doc.description,
      issueDate: doc.issueDate ? new Date(doc.issueDate) : undefined,
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
      uploadedBy: doc.uploadedBy,
      uploader: doc.uploader,
      isVerified: doc.isVerified,
      verifiedBy: doc.verifiedBy,
      verifier: doc.verifier,
      verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
    };
  }
}
