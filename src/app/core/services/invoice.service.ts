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
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invoices`;

  // CRUD de Facturas
  getInvoices(filters?: InvoiceFilters, pagination?: PaginationParams): Observable<PaginatedResponse<Invoice>> {
    let params = new HttpParams();

    // Pagination parameters
    if (pagination) {
      if (pagination.page) params = params.set('page', pagination.page.toString());
      if (pagination.limit) params = params.set('limit', pagination.limit.toString());
      if (pagination.sortBy) params = params.set('sortBy', pagination.sortBy);
      if (pagination.sortOrder) params = params.set('sortOrder', pagination.sortOrder);
    }

    if (filters) {
      // Basic filters
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.documentType) params = params.set('documentType', filters.documentType.toString());
      if (filters.customerId) params = params.set('customerId', filters.customerId);
      if (filters.supplierId) params = params.set('supplierId', filters.supplierId);
      if (filters.startDate) {
        const dateStr = filters.startDate instanceof Date
          ? filters.startDate.toISOString()
          : new Date(filters.startDate).toISOString();
        params = params.set('startDate', dateStr);
      }
      if (filters.endDate) {
        const dateStr = filters.endDate instanceof Date
          ? filters.endDate.toISOString()
          : new Date(filters.endDate).toISOString();
        params = params.set('endDate', dateStr);
      }

      // Advanced filters
      if (filters.folioNumber) params = params.set('folioNumber', filters.folioNumber);
      if (filters.minAmount !== undefined && filters.minAmount !== null) {
        params = params.set('minAmount', filters.minAmount.toString());
      }
      if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
        params = params.set('maxAmount', filters.maxAmount.toString());
      }
      if (filters.tripId) params = params.set('tripId', filters.tripId);
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.accountingPeriodStart) {
        const dateStr = filters.accountingPeriodStart instanceof Date
          ? filters.accountingPeriodStart.toISOString()
          : new Date(filters.accountingPeriodStart).toISOString();
        params = params.set('accountingPeriodStart', dateStr);
      }
      if (filters.accountingPeriodEnd) {
        const dateStr = filters.accountingPeriodEnd instanceof Date
          ? filters.accountingPeriodEnd.toISOString()
          : new Date(filters.accountingPeriodEnd).toISOString();
        params = params.set('accountingPeriodEnd', dateStr);
      }

      // Quick search
      if (filters.search) params = params.set('search', filters.search);
      
      // Sorting
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data.map(invoice => this.mapInvoiceFromBackend(invoice)),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }))
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

  // Obtener Notas de Crédito asociadas a una factura
  getCreditNotes(invoiceId: string): Observable<Invoice[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${invoiceId}/credit-notes`).pipe(
      map(invoices => invoices.map(inv => this.mapInvoiceFromBackend(inv)))
    );
  }

  // Cambiar estado de factura
  changeInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    options?: {
      categoryId?: string; // DEPRECATED - solo para facturas sin items
      itemCategories?: Array<{ invoiceItemId: string; categoryId: string }>; // NUEVO - para facturas con items
      paymentMethod?: string;
      accountingPeriod?: string;
    }
  ): Observable<Invoice> {
    const payload: any = { status };

    if (options?.categoryId) {
      payload.categoryId = options.categoryId;
    }

    if (options?.itemCategories) {
      payload.itemCategories = options.itemCategories;
    }

    if (options?.paymentMethod) {
      payload.paymentMethod = options.paymentMethod;
    }

    if (options?.accountingPeriod) {
      payload.accountingPeriod = options.accountingPeriod;
    }

    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, payload).pipe(
      map(invoice => this.mapInvoiceFromBackend(invoice))
    );
  }

  // Actualizar campos específicos (para facturas emitidas/pagadas)
  updateInvoiceFields(
    id: string,
    fields: {
      accountingPeriod?: string;
      notes?: string;
    }
  ): Observable<Invoice> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/fields`, fields).pipe(
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
    if (uploadData.accountingPeriod) {
      // Convert YYYY-MM to Date object and then to ISO string with timezone
      let dateStr: string;
      if (typeof uploadData.accountingPeriod === 'string') {
        // Si es string "YYYY-MM", convertir a Date en UTC
        const [year, month] = uploadData.accountingPeriod.split('-');
        const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0));
        dateStr = dateObj.toISOString();
      } else {
        // Si ya es Date, convertir a ISO
        dateStr = uploadData.accountingPeriod.toISOString();
      }
      formData.append('accountingPeriod', dateStr);
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
    if (uploadData.accountingPeriod) {
      // Convert YYYY-MM to Date object and then to ISO string with timezone
      let dateStr: string;
      if (typeof uploadData.accountingPeriod === 'string') {
        // Si es string "YYYY-MM", convertir a Date en UTC
        const [year, month] = uploadData.accountingPeriod.split('-');
        const dateObj = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0));
        dateStr = dateObj.toISOString();
      } else {
        // Si ya es Date, convertir a ISO
        dateStr = uploadData.accountingPeriod.toISOString();
      }
      formData.append('accountingPeriod', dateStr);
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
      accountingPeriod: new Date(invoice.accountingPeriod),
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
