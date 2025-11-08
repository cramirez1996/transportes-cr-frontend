import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MonthlyCashFlowReport } from '../../../../core/models/analytics.model';

@Component({
  selector: 'app-cash-flow-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cash-flow-report.component.html',
  styleUrl: './cash-flow-report.component.scss'
})
export class CashFlowReportComponent implements OnInit {
  data: MonthlyCashFlowReport | null = null;
  selectedMonth: string;
  loading = true;
  error: string | null = null;
  Math = Math; // Expose Math to template

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

    this.analyticsService.getMonthlyCashFlowReport(this.selectedMonth).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cash flow report:', err);
        this.error = 'Error al cargar el reporte de flujo de caja';
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

  getCashFlowStatusClass(): string {
    if (!this.data) return '';
    return this.data.netCashFlow > 0 ? 'text-green-600' : 'text-red-600';
  }

  getCashFlowStatusText(): string {
    if (!this.data) return '';
    return this.data.netCashFlow > 0 ? 'Positivo' : 'Negativo';
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    alert('Exportación a Excel próximamente');
  }

  exportToPDF(): void {
    // TODO: Implement PDF export
    alert('Exportación a PDF próximamente');
  }
}
