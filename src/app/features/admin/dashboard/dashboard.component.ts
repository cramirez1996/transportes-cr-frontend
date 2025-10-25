import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../../core/services/analytics.service';
import {
  DashboardKpis,
  DashboardTrends,
  MonthlyInvoiceTrends,
  MonthlyIvaTrends,
  MonthlyExpensesByCategory,
  VehiclePerformanceReport,
} from '../../../core/models/analytics.model';
import { LineChartComponent } from '../../../shared/components/line-chart/line-chart.component';
import { BarChartComponent } from '../../../shared/components/bar-chart/bar-chart.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LineChartComponent,
    BarChartComponent,
    MonthPickerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKpis | null = null;
  trends: DashboardTrends | null = null;
  invoiceTrends: MonthlyInvoiceTrends | null = null;
  ivaTrends: MonthlyIvaTrends | null = null;
  expensesByCategory: MonthlyExpensesByCategory | null = null;
  vehiclePerformance: VehiclePerformanceReport | null = null;

  selectedMonth: string;
  loading = true;
  error: string | null = null;

  // Main chart data (Income, Expenses, Profit)
  mainChartLabels: string[] = [];
  mainChartDatasets: { label: string; data: number[] }[] = [];

  // Trips chart data
  tripsChartLabels: string[] = [];
  tripsChartDatasets: { label: string; data: number[] }[] = [];

  // Invoice trends chart data
  invoiceChartLabels: string[] = [];
  invoiceChartDatasets: { label: string; data: number[] }[] = [];

  // IVA chart data
  ivaChartLabels: string[] = [];
  ivaChartDatasets: { label: string; data: number[] }[] = [];

  // Expenses by category chart data
  expensesCategoryChartLabels: string[] = [];
  expensesCategoryChartDatasets: { label: string; data: number[] }[] = [];

  // Vehicle performance chart data
  vehicleChartLabels: string[] = [];
  vehicleChartDatasets: { label: string; data: number[] }[] = [];

  constructor(private analyticsService: AnalyticsService) {
    this.selectedMonth = this.analyticsService.getCurrentMonthISO();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  onMonthChange(month: string): void {
    this.selectedMonth = month;
    this.loadKpis();
    this.loadVehiclePerformance();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load KPIs
    this.loadKpis();

    // Load all chart data in parallel
    forkJoin({
      trends: this.analyticsService.getMonthlyTrends(6),
      invoices: this.analyticsService.getMonthlyInvoiceTrends(6),
      iva: this.analyticsService.getMonthlyIvaTrends(6),
      expenses: this.analyticsService.getMonthlyExpensesByCategory(6),
      vehicles: this.analyticsService.getVehiclePerformance(this.selectedMonth),
    }).subscribe({
      next: (data) => {
        this.trends = data.trends;
        this.invoiceTrends = data.invoices;
        this.ivaTrends = data.iva;
        this.expensesByCategory = data.expenses;
        this.vehiclePerformance = data.vehicles;

        this.prepareMainChartData();
        this.prepareTripsChartData();
        this.prepareInvoiceChartData();
        this.prepareIvaChartData();
        this.prepareExpensesCategoryChartData();
        this.prepareVehicleChartData();
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Error al cargar datos del dashboard';
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

  private loadVehiclePerformance(): void {
    this.analyticsService.getVehiclePerformance(this.selectedMonth).subscribe({
      next: (data) => {
        this.vehiclePerformance = data;
        this.prepareVehicleChartData();
      },
      error: (err) => {
        console.error('Error loading vehicle performance:', err);
      }
    });
  }

  private prepareMainChartData(): void {
    if (!this.trends) return;

    this.mainChartLabels = this.trends.monthlyTrends.map(trend => {
      const date = new Date(trend.month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'long' });
    });

    this.mainChartDatasets = [
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

  private prepareTripsChartData(): void {
    if (!this.trends) return;

    this.tripsChartLabels = this.trends.monthlyTrends.map(trend => {
      const date = new Date(trend.month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'long' });
    });

    this.tripsChartDatasets = [
      {
        label: 'Viajes Completados',
        data: this.trends.monthlyTrends.map(t => t.trips),
      }
    ];
  }

  private prepareInvoiceChartData(): void {
    if (!this.invoiceTrends) return;

    this.invoiceChartLabels = this.invoiceTrends.monthlyInvoiceTrends.map(trend => {
      const date = new Date(trend.month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'long' });
    });

    this.invoiceChartDatasets = [
      {
        label: 'Facturas Emitidas',
        data: this.invoiceTrends.monthlyInvoiceTrends.map(t => t.saleInvoices),
      },
      {
        label: 'Facturas Recibidas',
        data: this.invoiceTrends.monthlyInvoiceTrends.map(t => t.purchaseInvoices),
      }
    ];
  }

  private prepareIvaChartData(): void {
    if (!this.ivaTrends) return;

    this.ivaChartLabels = this.ivaTrends.monthlyIvaTrends.map(trend => {
      const date = new Date(trend.month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'long' });
    });

    this.ivaChartDatasets = [
      {
        label: 'IVA a Pagar',
        data: this.ivaTrends.monthlyIvaTrends.map(t => t.ivaAPagar),
      }
    ];
  }

  private prepareExpensesCategoryChartData(): void {
    if (!this.expensesByCategory) return;

    this.expensesCategoryChartLabels = this.expensesByCategory.months.map(month => {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('es-CL', { month: 'long' });
    });

    // Take top 5 categories by total expenses
    const sortedCategories = [...this.expensesByCategory.categories]
      .sort((a, b) => {
        const totalA = a.data.reduce((sum, val) => sum + val, 0);
        const totalB = b.data.reduce((sum, val) => sum + val, 0);
        return totalB - totalA;
      })
      .slice(0, 5);

    this.expensesCategoryChartDatasets = sortedCategories.map(category => ({
      label: category.categoryName,
      data: category.data,
    }));
  }

  private prepareVehicleChartData(): void {
    if (!this.vehiclePerformance || this.vehiclePerformance.vehicles.length === 0) return;

    this.vehicleChartLabels = this.vehiclePerformance.vehicles.map(v => v.vehicleName);

    this.vehicleChartDatasets = [
      {
        label: 'Ingresos',
        data: this.vehiclePerformance.vehicles.map(v => v.income),
      },
      {
        label: 'Gastos',
        data: this.vehiclePerformance.vehicles.map(v => v.expenses),
      }
    ];
  }

  get selectedMonthDisplay(): string {
    return this.analyticsService.formatMonthDisplay(this.selectedMonth);
  }
}
