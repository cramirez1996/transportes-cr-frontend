import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef } from '../../../../../core/services/modal.service';
import { InvoiceStatus, SII_DOCUMENT_TYPES } from '../../../../../core/models/invoice.model';

export interface ReportInvoice {
  id: string;
  invoiceNumber: string;
  documentType: number;
  issueDate: string;
  customerName?: string;
  supplierName?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
}

@Component({
  selector: 'app-report-invoices-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-invoices-modal.component.html',
  styleUrl: './report-invoices-modal.component.scss'
})
export class ReportInvoicesModalComponent implements OnInit {
  modalRef!: ModalRef;
  data!: {
    title: string;
    invoices: ReportInvoice[];
    type: 'income' | 'expense';
  };

  InvoiceStatus = InvoiceStatus;

  ngOnInit(): void {
    // Data is injected by ModalService
  }

  getDocumentTypeLabel(code: number): string {
    const docType = SII_DOCUMENT_TYPES.find(type => type.code === code);
    return docType ? docType.name : `Documento ${code}`;
  }

  getStatusClass(status: InvoiceStatus): string {
    const statusClasses: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'bg-yellow-100 text-yellow-800',
      [InvoiceStatus.FULLY_CREDITED]: 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Anulada',
      [InvoiceStatus.PARTIALLY_CREDITED]: 'Parcialmente Acreditada',
      [InvoiceStatus.FULLY_CREDITED]: 'Totalmente Acreditada'
    };
    return labels[status] || status;
  }

  getTotalAmount(): number {
    return this.data.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  getTotalTax(): number {
    return this.data.invoices.reduce((sum, invoice) => sum + invoice.tax, 0);
  }

  getTotalSubtotal(): number {
    return this.data.invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  }

  close(): void {
    this.modalRef.dismiss();
  }
}
