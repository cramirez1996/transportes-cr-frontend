import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { MonthlyFinancialReport } from '../../../../core/models/analytics.model';
import { MonthPickerComponent } from '../../../../shared/components/month-picker/month-picker.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, RouterLink, MonthPickerComponent, KpiCardComponent],
  templateUrl: './financial-report.component.html',
  styleUrl: './financial-report.component.scss'
})
export class FinancialReportComponent implements OnInit {
  data: MonthlyFinancialReport | null = null;
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

  onMonthChange(month: string): void {
    this.selectedMonth = month;
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
}
