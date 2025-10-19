export enum DocumentEntityType {
  TRIP = 'TRIP',
  INVOICE = 'INVOICE',
  DRIVER = 'DRIVER',
  VEHICLE = 'VEHICLE',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  MAINTENANCE = 'MAINTENANCE',
  TRANSACTION = 'TRANSACTION',
  USER = 'USER',
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  DELIVERY_PROOF = 'DELIVERY_PROOF',
  PACKING_LIST = 'PACKING_LIST',
  QUOTE = 'QUOTE',
  CONTRACT = 'CONTRACT',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  TECHNICAL_REVIEW = 'TECHNICAL_REVIEW',
  PERMIT = 'PERMIT',
  ID_CARD = 'ID_CARD',
  RECEIPT = 'RECEIPT',
  OTHER = 'OTHER',
}

export interface DocumentUploader {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DocumentVerifier {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Document {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  description?: string;
  issueDate?: Date;
  expiryDate?: Date;
  uploadedBy: string;
  uploader?: DocumentUploader;
  isVerified: boolean;
  verifiedBy?: string;
  verifier?: DocumentVerifier;
  verifiedAt?: Date;
  tags?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateDocumentDto {
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  originalName: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
  tags?: Record<string, any>;
}

export interface UpdateDocumentDto {
  description?: string;
  documentType?: DocumentType;
  issueDate?: string;
  expiryDate?: string;
  tags?: Record<string, any>;
}

export interface VerifyDocumentDto {
  isVerified: boolean;
}

export interface DocumentFilterDto {
  entityType?: DocumentEntityType;
  entityId?: string;
  documentType?: DocumentType;
  expiringBefore?: string;
  expiringAfter?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  byEntityType: {
    [key in DocumentEntityType]?: {
      count: number;
      size: number;
    };
  };
  byDocumentType: {
    [key in DocumentType]?: {
      count: number;
      size: number;
    };
  };
}

// Helper para obtener etiquetas en español
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.INVOICE]: 'Factura',
  [DocumentType.DELIVERY_PROOF]: 'Comprobante de Entrega',
  [DocumentType.PACKING_LIST]: 'Lista de Empaque',
  [DocumentType.QUOTE]: 'Cotización',
  [DocumentType.CONTRACT]: 'Contrato',
  [DocumentType.LICENSE]: 'Licencia',
  [DocumentType.INSURANCE]: 'Seguro',
  [DocumentType.TECHNICAL_REVIEW]: 'Revisión Técnica',
  [DocumentType.PERMIT]: 'Permiso',
  [DocumentType.ID_CARD]: 'Cédula de Identidad',
  [DocumentType.RECEIPT]: 'Recibo',
  [DocumentType.OTHER]: 'Otro',
};

export const DOCUMENT_ENTITY_TYPE_LABELS: Record<DocumentEntityType, string> = {
  [DocumentEntityType.TRIP]: 'Viaje',
  [DocumentEntityType.INVOICE]: 'Factura',
  [DocumentEntityType.DRIVER]: 'Conductor',
  [DocumentEntityType.VEHICLE]: 'Vehículo',
  [DocumentEntityType.CUSTOMER]: 'Cliente',
  [DocumentEntityType.SUPPLIER]: 'Proveedor',
  [DocumentEntityType.MAINTENANCE]: 'Mantenimiento',
  [DocumentEntityType.TRANSACTION]: 'Transacción',
  [DocumentEntityType.USER]: 'Usuario',
};

// Helper para determinar si un documento puede tener fecha de vencimiento
export const DOCUMENT_TYPES_WITH_EXPIRY: DocumentType[] = [
  DocumentType.LICENSE,
  DocumentType.INSURANCE,
  DocumentType.TECHNICAL_REVIEW,
  DocumentType.PERMIT,
  DocumentType.ID_CARD,
];

// Helper para obtener el icono según el tipo MIME
export function getDocumentIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture_as_pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'folder_zip';
  return 'insert_drive_file';
}

// Helper para formatear el tamaño del archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper para verificar si un documento está próximo a vencer
export function isDocumentExpiringSoon(document: Document, daysThreshold: number = 30): boolean {
  if (!document.expiryDate) return false;
  const today = new Date();
  const expiryDate = new Date(document.expiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= daysThreshold;
}

// Helper para verificar si un documento está vencido
export function isDocumentExpired(document: Document): boolean {
  if (!document.expiryDate) return false;
  const today = new Date();
  const expiryDate = new Date(document.expiryDate);
  return expiryDate < today;
}
