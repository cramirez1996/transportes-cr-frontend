import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { DashboardKpis, DashboardTrends } from '../../../core/models/analytics.model';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { LineChartComponent } from '../../../shared/components/line-chart/line-chart.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    LineChartComponent,
    MonthPickerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKpis | null = null;
  trends: DashboardTrends | null = null;
  selectedMonth: string;
  loading = true;
  error: string | null = null;

  // Chart data
  chartLabels: string[] = [];
  chartDatasets: { label: string; data: number[] }[] = [];

  constructor(private analyticsService: AnalyticsService) {
    this.selectedMonth = this.analyticsService.getCurrentMonthISO();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  onMonthChange(month: string): void {
    this.selectedMonth = month;
    this.loadKpis();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load KPIs
    this.loadKpis();

    // Load trends
    this.analyticsService.getMonthlyTrends(6).subscribe({
      next: (data) => {
        this.trends = data;
        this.prepareChartData();
      },
      error: (err) => {
        console.error('Error loading trends:', err);
        this.error = 'Error al cargar tendencias';
      }
    });
  }

  private loadKpis(): void {
    this.analyticsService.getDashboardKpis(this.selectedMonth).subscribe({
      next: (data) => {
        this.kpis = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading KPIs:', err);
        this.error = 'Error al cargar métricas del dashboard';
        this.loading = false;
      }
    });
  }

  private prepareChartData(): void {
    if (!this.trends) return;

    // Format month labels
    this.chartLabels = this.trends.monthlyTrends.map(trend => {
      const date = new Date(trend.month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
    });

    // Prepare datasets
    this.chartDatasets = [
      {
        label: 'Ingresos',
        data: this.trends.monthlyTrends.map(t => t.income),
      },
      {
        label: 'Gastos',
        data: this.trends.monthlyTrends.map(t => t.expenses),
      },
      {
        label: 'Ganancia',
        data: this.trends.monthlyTrends.map(t => t.profit),
      }
    ];
  }

  get selectedMonthDisplay(): string {
    return this.analyticsService.formatMonthDisplay(this.selectedMonth);
  }
}
