import { Tenant } from './auth.model';

export enum InvoiceType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  PARTIALLY_CREDITED = 'PARTIALLY_CREDITED',
  FULLY_CREDITED = 'FULLY_CREDITED',
}

export interface InvoiceItem {
  id?: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  isExempt: boolean;
  discountPercent?: number;
  discountAmount?: number;
  subtotal: number;
}

export interface InvoiceTax {
  id?: string;
  invoiceId?: string;
  taxCode: number;
  taxName: string;
  taxAmount: number;
  taxRate?: number;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  documentType: number;
  folioNumber: string;
  issueDate: Date;
  receptionDate?: Date;
  acknowledgeDate?: Date;
  accountingPeriod: Date;
  tenant?: Tenant;
  customer?: any;
  supplier?: any;
  trip?: any;
  vehicle?: any;
  amountExempt: number;
  amountNet: number;
  ivaRecoverable: number;
  ivaNonRecoverable: number;
  ivaNonRecoverableCode?: number;
  ivaCommonUse: number;
  ivaNotWithheld: number;
  amountNetFixedAsset: number;
  ivaFixedAsset: number;
  taxNoCredit: number;
  totalAmount: number;
  notes?: string;
  tags?: Record<string, any>;
  xmlFile?: string;
  pdfFile?: string;
  status: InvoiceStatus;
  createdBy?: any;
  referencedInvoiceId?: string;
  referencedInvoice?: Invoice;
  creditNotes?: Invoice[];
  referenceReason?: string;
  referenceCode?: number;
  items: InvoiceItem[];
  taxes: InvoiceTax[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDto {
  type: InvoiceType;
  documentType: number;
  folioNumber: string;
  issueDate: Date;
  receptionDate?: Date;
  acknowledgeDate?: Date;
  accountingPeriod: Date;
  customerId?: string;
  supplierId?: string;
  tripId?: string;
  vehicleId?: string;
  amountExempt?: number;
  amountNet?: number;
  ivaRecoverable?: number;
  ivaNonRecoverable?: number;
  ivaNonRecoverableCode?: number;
  ivaCommonUse?: number;
  ivaNotWithheld?: number;
  amountNetFixedAsset?: number;
  ivaFixedAsset?: number;
  taxNoCredit?: number;
  totalAmount: number;
  notes?: string;
  tags?: Record<string, any>;
  xmlFile?: string;
  pdfFile?: string;
  status?: InvoiceStatus;
  items?: InvoiceItem[];
  taxes?: InvoiceTax[];
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {}

export interface InvoiceFilters {
  // Basic filters
  type?: InvoiceType;
  status?: InvoiceStatus;
  startDate?: Date | string;
  endDate?: Date | string;

  // Advanced filters
  customerId?: string;
  supplierId?: string;
  folioNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  tripId?: string;
  vehicleId?: string;
  accountingPeriodStart?: Date | string;
  accountingPeriodEnd?: Date | string;
  search?: string; // Quick search across multiple fields
}

export interface InvoiceStatistics {
  totalSales: number;
  totalPurchases: number;
  pendingInvoices: number;
  paidInvoices: number;
  netIncome: number;
}

export interface UploadXmlInvoiceDto {
  tripId?: string;
  notes?: string;
  accountingPeriod?: Date | string;
}

export interface UploadXmlBulkDto {
  tripId?: string;
  notes?: string;
  skipDuplicates?: boolean;
  accountingPeriod?: Date | string;
}

export enum BulkUploadStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface BulkUploadFileResult {
  filename: string;
  status: BulkUploadStatus;
  invoiceId?: string;
  folioNumber?: string;
  totalAmount?: number;
  error?: string;
  reason?: string;
}

export interface BulkUploadSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

export interface BulkUploadResponse {
  summary: BulkUploadSummary;
  results: BulkUploadFileResult[];
}
