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
  xmlFile?: string;
  pdfFile?: string;
  status: InvoiceStatus;
  createdBy?: any;
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
  xmlFile?: string;
  pdfFile?: string;
  status?: InvoiceStatus;
  items?: InvoiceItem[];
  taxes?: InvoiceTax[];
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {}

export interface InvoiceFilters {
  type?: InvoiceType;
  status?: InvoiceStatus;
  customerId?: string;
  supplierId?: string;
  startDate?: Date;
  endDate?: Date;
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
}
