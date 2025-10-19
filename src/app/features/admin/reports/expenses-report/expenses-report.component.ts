import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { ExpensesByCategoryReport } from '../../../../core/models/analytics.model';
import { MonthPickerComponent } from '../../../../shared/components/month-picker/month-picker.component';
import { PieChartComponent } from '../../../../shared/components/pie-chart/pie-chart.component';

@Component({
  selector: 'app-expenses-report',
  standalone: true,
  imports: [CommonModule, RouterLink, MonthPickerComponent, PieChartComponent],
  templateUrl: './expenses-report.component.html',
  styleUrl: './expenses-report.component.scss'
})
export class ExpensesReportComponent implements OnInit {
  data: ExpensesByCategoryReport | null = null;
  selectedMonth: string;
  loading = true;
  error: string | null = null;

  // Chart data
  chartLabels: string[] = [];
  chartData: number[] = [];

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

    this.analyticsService.getExpensesByCategory({ month: this.selectedMonth }).subscribe({
      next: (data) => {
        this.data = data;
        this.prepareChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading expenses by category:', err);
        this.error = 'Error al cargar el reporte de gastos';
        this.loading = false;
      }
    });
  }

  private prepareChartData(): void {
    if (!this.data) return;

    this.chartLabels = this.data.categories.map(c => c.categoryName);
    this.chartData = this.data.categories.map(c => c.totalAmount);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }

  getPercentageBarWidth(percentage: number): string {
    return `${percentage}%`;
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 40) return 'bg-red-500';
    if (percentage >= 20) return 'bg-yellow-500';
    if (percentage >= 10) return 'bg-blue-500';
    return 'bg-green-500';
  }

  get totalTransactions(): number {
    if (!this.data) return 0;
    return this.data.categories.reduce((sum, c) => sum + c.transactionCount, 0);
  }

  get averageExpensePerTransaction(): number {
    if (!this.data) return 0;
    const total = this.totalTransactions;
    return total > 0 ? this.data.totalExpenses / total : 0;
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    alert('Exportación a Excel próximamente');
  }
}
