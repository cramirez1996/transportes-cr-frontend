import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AggregateResult,
  GroupByDimension,
} from '../../../../../../core/models/transaction-explorer.model';
import { ModalService } from '../../../../../../core/services/modal.service';
import { ReportInvoicesModalComponent, ReportInvoice } from '../../../reports/report-invoices-modal/report-invoices-modal.component';
import { InvoiceStatus } from '../../../../../../core/models/invoice.model';

@Component({
  selector: 'app-breakdown-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breakdown-table.component.html',
  styleUrls: ['./breakdown-table.component.scss'],
})
export class BreakdownTableComponent {
  @Input() data: AggregateResult | null = null;
  @Input() loading = false;
  @Input() dimension: GroupByDimension = GroupByDimension.CATEGORY;

  private router = inject(Router);
  private modalService = inject(ModalService);

  constructor() {}

  /**
   * Format currency in CLP
   * Shows absolute value with sign indicator
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Get percentage bar width
   */
  getBarWidth(percentage: number): string {
    return `${Math.min(Math.abs(percentage), 100)}%`;
  }

  /**
   * Check if value is income (positive)
   */
  isIncome(value: number): boolean {
    return value >= 0;
  }

  /**
   * Handle drill-down to transactions
   */
  drillDown(group: any): void {
    // Navigate to transaction list with filters
    const queryParams: any = {};

    switch (this.dimension) {
      case GroupByDimension.CATEGORY:
        queryParams.categoryId = group.key;
        break;
      case GroupByDimension.VEHICLE:
        queryParams.vehicleId = group.key;
        break;
      case GroupByDimension.DRIVER:
        queryParams.driverId = group.key;
        break;
      case GroupByDimension.CUSTOMER:
        queryParams.customerId = group.key;
        break;
      case GroupByDimension.SUPPLIER:
        queryParams.supplierId = group.key;
        break;
      case GroupByDimension.TYPE:
        queryParams.type = group.key;
        break;
      case GroupByDimension.PAYMENT_METHOD:
        queryParams.paymentMethod = group.key;
        break;
    }

    this.router.navigate(['/admin/accounting/transactions'], { queryParams });
  }

  /**
   * Get bar color based on value (green for income, red for expense)
   */
  getBarColor(value: number): string {
    if (value >= 0) {
      // Income - green
      return 'bg-emerald-500';
    } else {
      // Expense - red
      return 'bg-red-500';
    }
  }

  /**
   * Get text color based on value
   */
  getTextColor(value: number): string {
    if (value >= 0) {
      return 'text-emerald-600';
    } else {
      return 'text-red-600';
    }
  }

  /**
   * Show invoices modal for a specific group
   */
  showInvoices(group: any, event: Event): void {
    event.stopPropagation();

    // Determine if this is income or expense based on group type
    const type: 'income' | 'expense' = group.value >= 0 ? 'income' : 'expense';

    // Create sample invoices (in real implementation, fetch from API)
    const sampleInvoices: ReportInvoice[] = this.generateSampleInvoices(group, type);

    this.modalService.open(ReportInvoicesModalComponent, {
      title: `Facturas - ${group.label}`, // ModalService requires title at top level
      data: {
        title: `Facturas - ${group.label}`,
        invoices: sampleInvoices,
        type: type
      }
    });
  }

  /**
   * Generate sample invoices for demonstration
   * TODO: Replace with actual API call to fetch invoices by group
   */
  private generateSampleInvoices(group: any, type: 'income' | 'expense'): ReportInvoice[] {
    // This is temporary - should fetch from backend
    const count = Math.min(group.count, 5); // Show up to 5 sample invoices
    const invoices: ReportInvoice[] = [];

    for (let i = 0; i < count; i++) {
      const subtotal = Math.abs(group.value) / count * 0.84; // Approximate subtotal (without IVA)
      const tax = subtotal * 0.19; // 19% IVA
      const total = subtotal + tax;

      invoices.push({
        id: `sample-${i}`,
        invoiceNumber: type === 'income' ? `F-${1000 + i}` : `FC-${2000 + i}`,
        documentType: type === 'income' ? 33 : 46, // Factura Electrónica or Factura de Compra
        issueDate: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        customerName: type === 'income' ? `Cliente ${i + 1}` : undefined,
        supplierName: type === 'expense' ? `Proveedor ${i + 1}` : undefined,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: InvoiceStatus.PAID
      });
    }

    return invoices;
  }
}
