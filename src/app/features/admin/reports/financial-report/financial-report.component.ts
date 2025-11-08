import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MonthlyFinancialReport } from '../../../../core/models/analytics.model';
import { ModalService } from '../../../../core/services/modal.service';
import { ReportInvoicesModalComponent, ReportInvoice } from '../report-invoices-modal/report-invoices-modal.component';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { InvoiceStatus, InvoiceType, InvoiceFilters, Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './financial-report.component.html',
  styleUrl: './financial-report.component.scss'
})
export class FinancialReportComponent implements OnInit {
  data: MonthlyFinancialReport | null = null;
  selectedMonth: string;
  loading = true;
  error: string | null = null;
  Math = Math; // Expose Math to template

  private modalService = inject(ModalService);
  private invoiceService = inject(InvoiceService);

  constructor(private analyticsService: AnalyticsService) {
    this.selectedMonth = this.analyticsService.getCurrentMonthISO();
  }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Get selected month in YYYY-MM format for input[type="month"]
   */
  get selectedMonthInput(): string {
    // Convert YYYY-MM-DD to YYYY-MM
    return this.selectedMonth.substring(0, 7);
  }

  /**
   * Handle month input change
   */
  onMonthInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Convert YYYY-MM to YYYY-MM-01
    this.selectedMonth = `${input.value}-01`;
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    this.analyticsService.getMonthlyFinancialReport(this.selectedMonth).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading financial report:', err);
        this.error = 'Error al cargar el reporte financiero';
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  get selectedMonthDisplay(): string {
    return this.analyticsService.formatMonthDisplay(this.selectedMonth);
  }

  getIvaStatusClass(): string {
    if (!this.data) return '';
    return this.data.iva.ivaAPagar > 0 ? 'text-red-600' : 'text-green-600';
  }

  getIvaStatusText(): string {
    if (!this.data) return '';
    return this.data.iva.ivaAPagar > 0 ? 'A Pagar al SII' : 'A Favor';
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    alert('Exportación a Excel próximamente');
  }

  exportToPDF(): void {
    // TODO: Implement PDF export
    alert('Exportación a PDF próximamente');
  }

  /**
   * Show invoices modal for income
   */
  showIncomeInvoices(): void {
    if (!this.data) return;

    // Build filters and open modal immediately
    const filters = this.buildInvoiceFilters('income');

    this.modalService.open(ReportInvoicesModalComponent, {
      title: `Facturas de Venta - ${this.selectedMonthDisplay}`,
      data: {
        title: `Facturas de Venta - ${this.selectedMonthDisplay}`,
        type: 'income',
        filters: filters
      }
    });
  }

  /**
   * Show invoices modal for expenses
   */
  showExpenseInvoices(): void {
    if (!this.data) return;

    // Build filters and open modal immediately
    const filters = this.buildInvoiceFilters('expense');

    this.modalService.open(ReportInvoicesModalComponent, {
      title: `Facturas de Compra - ${this.selectedMonthDisplay}`,
      data: {
        title: `Facturas de Compra - ${this.selectedMonthDisplay}`,
        type: 'expense',
        filters: filters
      }
    });
  }

  /**
   * Build invoice filters for the selected month
   */
  private buildInvoiceFilters(type: 'income' | 'expense'): InvoiceFilters {
    // Parse selectedMonth (YYYY-MM-DD format) to get year and month
    const [year, month] = this.selectedMonth.split('-').map(Number);

    // Calculate start and end dates for the selected month in local timezone
    const startDate = new Date(year, month - 1, 1); // month - 1 because months are 0-indexed
    const endDate = new Date(year, month, 0); // Day 0 of next month = last day of current month

    return {
      type: type === 'income' ? InvoiceType.SALE : InvoiceType.PURCHASE,
      startDate: startDate,
      endDate: endDate,
      sortBy: 'issueDate',
      sortOrder: 'DESC'
    };
  }
}
