import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceFilters,
  InvoiceStatistics,
  InvoiceStatus,
  UploadXmlInvoiceDto,
  UploadXmlBulkDto,
  BulkUploadResponse,
} from '../models/invoice.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invoices`;

  // CRUD de Facturas
  getInvoices(filters?: InvoiceFilters): Observable<Invoice[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.customerId) params = params.set('customerId', filters.customerId);
      if (filters.supplierId) params = params.set('supplierId', filters.supplierId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(invoices => invoices.map(invoice => this.mapInvoiceFromBackend(invoice)))
    );
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  createInvoice(invoiceData: CreateInvoiceDto): Observable<Invoice> {
    const payload = this.mapInvoiceToBackend(invoiceData);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  updateInvoice(id: string, invoiceData: UpdateInvoiceDto): Observable<Invoice> {
    const payload = this.mapInvoiceToBackend(invoiceData);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  deleteInvoice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Cambiar estado de factura
  changeInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    options?: {
      categoryId?: string;
      paymentMethod?: string;
    }
  ): Observable<Invoice> {
    const payload: any = { status };

    if (options?.categoryId) {
      payload.categoryId = options.categoryId;
    }

    if (options?.paymentMethod) {
      payload.paymentMethod = options.paymentMethod;
    }

    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, payload).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  // Estadísticas
  getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
  }): Observable<InvoiceStatistics> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      if (filters.customerId) params = params.set('customerId', filters.customerId);
    }

    return this.http.get<InvoiceStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  // Subir XML
  uploadXmlInvoice(file: File, uploadData: UploadXmlInvoiceDto): Observable<Invoice> {
    const formData = new FormData();
    formData.append('file', file);

    if (uploadData.tripId) {
      formData.append('tripId', uploadData.tripId);
    }
    if (uploadData.notes) {
      formData.append('notes', uploadData.notes);
    }

    return this.http.post<any>(`${this.apiUrl}/upload-xml`, formData).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  // Subir múltiples XMLs
  uploadXmlBulk(files: File[], uploadData: UploadXmlBulkDto): Observable<BulkUploadResponse> {
    const formData = new FormData();

    // Agregar todos los archivos
    files.forEach(file => {
      formData.append('files', file);
    });

    if (uploadData.tripId) {
      formData.append('tripId', uploadData.tripId);
    }
    if (uploadData.notes) {
      formData.append('notes', uploadData.notes);
    }
    if (uploadData.skipDuplicates !== undefined) {
      formData.append('skipDuplicates', uploadData.skipDuplicates.toString());
    }

    return this.http.post<BulkUploadResponse>(`${this.apiUrl}/upload-xml-bulk`, formData);
  }

  // Mappers
  private mapInvoiceFromBackend(invoice: any): Invoice {
    return {
      id: invoice.id,
      type: invoice.type,
      documentType: invoice.documentType,
      folioNumber: invoice.folioNumber,
      issueDate: new Date(invoice.issueDate),
      receptionDate: invoice.receptionDate ? new Date(invoice.receptionDate) : undefined,
      acknowledgeDate: invoice.acknowledgeDate ? new Date(invoice.acknowledgeDate) : undefined,
      customer: invoice.customer,
      supplier: invoice.supplier,
      trip: invoice.trip,
      vehicle: invoice.vehicle,
      tenant: invoice.tenant,
      amountExempt: parseFloat(invoice.amountExempt),
      amountNet: parseFloat(invoice.amountNet),
      ivaRecoverable: parseFloat(invoice.ivaRecoverable),
      ivaNonRecoverable: parseFloat(invoice.ivaNonRecoverable),
      ivaNonRecoverableCode: invoice.ivaNonRecoverableCode,
      ivaCommonUse: parseFloat(invoice.ivaCommonUse),
      ivaNotWithheld: parseFloat(invoice.ivaNotWithheld),
      amountNetFixedAsset: parseFloat(invoice.amountNetFixedAsset),
      ivaFixedAsset: parseFloat(invoice.ivaFixedAsset),
      taxNoCredit: parseFloat(invoice.taxNoCredit),
      totalAmount: parseFloat(invoice.totalAmount),
      notes: invoice.notes,
      xmlFile: invoice.xmlFile,
      pdfFile: invoice.pdfFile,
      status: invoice.status,
      createdBy: invoice.createdBy,
      items: invoice.items || [],
      taxes: invoice.taxes || [],
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
    };
  }

  private mapInvoiceToBackend(invoiceData: CreateInvoiceDto | UpdateInvoiceDto): any {
    const payload: any = { ...invoiceData };

    if (invoiceData.issueDate) {
      payload.issueDate = invoiceData.issueDate instanceof Date
        ? invoiceData.issueDate.toISOString().split('T')[0]
        : invoiceData.issueDate;
    }

    if (invoiceData.receptionDate) {
      payload.receptionDate = invoiceData.receptionDate instanceof Date
        ? invoiceData.receptionDate.toISOString()
        : invoiceData.receptionDate;
    }

    if (invoiceData.acknowledgeDate) {
      payload.acknowledgeDate = invoiceData.acknowledgeDate instanceof Date
        ? invoiceData.acknowledgeDate.toISOString()
        : invoiceData.acknowledgeDate;
    }

    return payload;
  }
}
