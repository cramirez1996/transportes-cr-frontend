import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { TripProfitabilitySummary, TripProfitability } from '../../../../core/models/analytics.model';
import { MonthPickerComponent } from '../../../../shared/components/month-picker/month-picker.component';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-trip-profitability-report',
  standalone: true,
  imports: [CommonModule, RouterLink, MonthPickerComponent, KpiCardComponent],
  templateUrl: './trip-profitability-report.component.html',
  styleUrl: './trip-profitability-report.component.scss'
})
export class TripProfitabilityReportComponent implements OnInit {
  data: TripProfitabilitySummary | null = null;
  selectedMonth: string;
  loading = true;
  error: string | null = null;

  // Sorting
  sortColumn: keyof TripProfitability = 'profit';
  sortDirection: 'asc' | 'desc' = 'desc';

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

    this.analyticsService.getTripProfitability({ month: this.selectedMonth }).subscribe({
      next: (data) => {
        this.data = data;
        this.sortTrips();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading trip profitability:', err);
        this.error = 'Error al cargar el reporte de rentabilidad';
        this.loading = false;
      }
    });
  }

  sort(column: keyof TripProfitability): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.sortTrips();
  }

  private sortTrips(): void {
    if (!this.data) return;

    this.data.trips.sort((a, b) => {
      const aVal = a[this.sortColumn];
      const bVal = b[this.sortColumn];

      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: keyof TripProfitability): string {
    if (this.sortColumn !== column) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getProfitClass(profit: number): string {
    if (profit > 0) return 'text-green-600 font-semibold';
    if (profit < 0) return 'text-red-600 font-semibold';
    return 'text-gray-600';
  }

  getMarginClass(margin: number): string {
    if (margin >= 50) return 'bg-green-100 text-green-800';
    if (margin >= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    alert('Exportación a Excel próximamente');
  }
}
