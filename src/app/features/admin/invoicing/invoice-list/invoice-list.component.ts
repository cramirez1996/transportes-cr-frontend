import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice, InvoiceType, InvoiceStatus, InvoiceFilters } from '../../../../core/models/invoice.model';
import { UploadXmlModalComponent } from '../upload-xml-modal/upload-xml-modal.component';
import { ChangeStatusModalComponent } from '../change-status-modal/change-status-modal.component';
import { PaymentMethod } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, RouterModule, FormsModule, UploadXmlModalComponent, ChangeStatusModalComponent],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  @ViewChild(UploadXmlModalComponent) uploadXmlModal!: UploadXmlModalComponent;
  @ViewChild(ChangeStatusModalComponent) changeStatusModal!: ChangeStatusModalComponent;

  currentInvoice: Invoice | null = null;

  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filters: InvoiceFilters = {};
  InvoiceType = InvoiceType;
  InvoiceStatus = InvoiceStatus;

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;

    this.invoiceService.getInvoices(this.filters).subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las facturas';
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredInvoices = this.invoices;
    this.totalPages = Math.ceil(this.filteredInvoices.length / this.pageSize);
  }

  onFilterChange(): void {
    this.loadInvoices();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadInvoices();
  }

  openChangeStatusModal(invoice: Invoice, newStatus: InvoiceStatus): void {
    this.currentInvoice = invoice;
    this.changeStatusModal.open(invoice.type, invoice.status, newStatus);
  }

  onStatusChanged(data: { status: InvoiceStatus; categoryId?: string; paymentMethod?: PaymentMethod }): void {
    if (!this.currentInvoice) {
      return;
    }

    this.invoiceService.changeInvoiceStatus(
      this.currentInvoice.id,
      data.status,
      {
        categoryId: data.categoryId,
        paymentMethod: data.paymentMethod
      }
    ).subscribe({
      next: () => {
        this.loadInvoices();
        this.currentInvoice = null;
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        const errorMessage = err.error?.message || 'Error al cambiar el estado de la factura';
        alert(errorMessage);
        this.currentInvoice = null;
      }
    });
  }

  deleteInvoice(invoice: Invoice): void {
    if (invoice.status !== InvoiceStatus.DRAFT) {
      alert('Solo se pueden eliminar facturas en estado borrador');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar la factura ${invoice.folioNumber}?`)) {
      this.invoiceService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.loadInvoices();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar la factura');
        }
      });
    }
  }

  get paginatedInvoices(): Invoice[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredInvoices.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getStatusLabel(status: InvoiceStatus): string {
    const labels = {
      [InvoiceStatus.DRAFT]: 'Borrador',
      [InvoiceStatus.ISSUED]: 'Emitida',
      [InvoiceStatus.PAID]: 'Pagada',
      [InvoiceStatus.CANCELLED]: 'Anulada'
    };
    return labels[status];
  }

  getStatusClass(status: InvoiceStatus): string {
    const classes = {
      [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [InvoiceStatus.ISSUED]: 'bg-blue-100 text-blue-800',
      [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
      [InvoiceStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return classes[status];
  }

  getTypeLabel(type: InvoiceType): string {
    return type === InvoiceType.SALE ? 'Venta' : 'Compra';
  }

  openUploadXmlModal(): void {
    this.uploadXmlModal.open();
  }
}
