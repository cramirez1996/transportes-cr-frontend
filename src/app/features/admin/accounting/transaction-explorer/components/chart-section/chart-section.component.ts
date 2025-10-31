import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  LineController,
  LineElement,
  BarController,
  BarElement,
  ArcElement,
  PieController,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  TimeSeriesResult,
  GroupedTimeSeriesResult,
  CHART_COLORS,
  CHART_PALETTE,
} from '../../../../../../core/models/transaction-explorer.model';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type ChartType = 'line' | 'bar' | 'pie';

@Component({
  selector: 'app-chart-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-section.component.html',
  styleUrls: ['./chart-section.component.scss'],
})
export class ChartSectionComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() timeSeriesData: TimeSeriesResult | null = null;
  @Input() groupedTimeSeriesData: GroupedTimeSeriesResult | null = null;
  @Input() loading = false;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  selectedChartType: ChartType = 'line';

  chartTypeOptions = [
    {
      value: 'line' as ChartType,
      label: 'Línea',
      icon: 'M7 21l-3-9 6-6 3 9 6-12 3 9' // Line chart icon (trending up)
    },
    {
      value: 'bar' as ChartType,
      label: 'Barras',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' // Bar chart icon (side by side bars)
    },
    {
      value: 'pie' as ChartType,
      label: 'Barras Apiladas',
      icon: 'M4 7h16M4 12h16M4 17h16M7 3v18M17 3v18' // Stacked bars icon (grid pattern)
    },
  ];

  ngAfterViewInit(): void {
    // Render chart after view init if we already have data
    if (this.timeSeriesData || this.groupedTimeSeriesData) {
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Render chart whenever data changes
    if ((changes['timeSeriesData'] || changes['groupedTimeSeriesData']) && this.chartCanvas) {
      this.renderChart();
    }

    // Render chart when loading finishes (true -> false)
    if (changes['loading'] && !changes['loading'].currentValue && (this.timeSeriesData || this.groupedTimeSeriesData)) {
      setTimeout(() => {
        this.renderChart();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  /**
   * Change chart type
   */
  changeChartType(type: ChartType): void {
    this.selectedChartType = type;
    this.renderChart();
  }

  /**
   * Render Chart.js chart (line, bar, or pie)
   */
  private renderChart(): void {
    if (!this.chartCanvas) {
      return;
    }

    // Destroy existing chart
    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let config: ChartConfiguration;

    // Check if we have grouped data (new format)
    if (this.groupedTimeSeriesData && this.groupedTimeSeriesData.series.length > 0) {
      config = this.renderGroupedChart();
    } else if (this.timeSeriesData) {
      config = this.renderTraditionalChart();
    } else {
      return;
    }

    this.chart = new Chart(ctx, config);
  }

  /**
   * Render traditional chart (Income/Expense/Net)
   */
  private renderTraditionalChart(): ChartConfiguration {
    const labels = this.timeSeriesData!.series.map((point) => point.period);
    const incomeData = this.timeSeriesData!.series.map((point) => point.income);
    // Convert expenses to positive values for display (backend returns negative)
    const expenseData = this.timeSeriesData!.series.map((point) => Math.abs(point.expense));
    const netData = this.timeSeriesData!.series.map((point) => point.net);

    if (this.selectedChartType === 'pie') {
      // Grouped bar chart with 3 separate bars: Expense (red), Income (green), Net (blue)
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Gastos',
              data: expenseData,
              backgroundColor: CHART_COLORS.expense,
              borderWidth: 0,
            },
            {
              label: 'Ingresos',
              data: incomeData,
              backgroundColor: CHART_COLORS.income,
              borderWidth: 0,
            },
            {
              label: 'Ganancias',
              data: netData,
              backgroundColor: CHART_COLORS.net,
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12 },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y ?? 0;
                  return `${label}: ${this.formatCurrency(value)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                font: { size: 11 },
                callback: (value: any) => this.formatCurrencyShort(Number(value)),
              },
            },
          },
        },
      };
    }

    // Line or Bar
    return {
      type: this.selectedChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            borderColor: CHART_COLORS.income,
            backgroundColor: this.hexToRgba(CHART_COLORS.income, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Gastos',
            data: expenseData,
            borderColor: CHART_COLORS.expense,
            backgroundColor: this.hexToRgba(CHART_COLORS.expense, 0.1),
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Neto',
            data: netData,
            borderColor: CHART_COLORS.net,
            backgroundColor: this.hexToRgba(CHART_COLORS.net, 0.1),
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5],
          },
        ],
      },
      options: this.getLineBarChartOptions(),
    };
  }

  /**
   * Render grouped chart (one line per entity)
   * Now handles signed values: expenses are negative, income is positive
   */
  private renderGroupedChart(): ChartConfiguration {
    const series = this.groupedTimeSeriesData!.series;

    // Extract all unique periods from all series
    const periodsSet = new Set<string>();
    series.forEach(s => s.data.forEach(d => periodsSet.add(d.period)));
    const labels = Array.from(periodsSet).sort();

    if (this.selectedChartType === 'pie') {
      // Stacked bar chart: separate income and expenses
      // Income series (positive values)
      const incomeSeries = series.filter(s => s.total >= 0);
      // Expense series (negative values)
      const expenseSeries = series.filter(s => s.total < 0);

      const datasets: any[] = [];

      // Add income datasets (green tones)
      incomeSeries.forEach((s, index) => {
        const dataMap = new Map(s.data.map(d => [d.period, d.value]));
        const data = labels.map(period => dataMap.get(period) || 0);

        datasets.push({
          label: s.label,
          data,
          backgroundColor: this.getIncomeColor(index),
          borderWidth: 0,
          stack: 'income', // Stack income together
        });
      });

      // Add expense datasets (red tones)
      expenseSeries.forEach((s, index) => {
        const dataMap = new Map(s.data.map(d => [d.period, d.value]));
        const data = labels.map(period => dataMap.get(period) || 0);

        datasets.push({
          label: s.label,
          data,
          backgroundColor: this.getExpenseColor(index),
          borderWidth: 0,
          stack: 'expense', // Stack expenses together (they're negative)
        });
      });

      return {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            title: { display: false },
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12 },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              callbacks: {
                label: (context: any) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y ?? 0;
                  return `${label}: ${this.formatCurrency(Math.abs(value))}`;
                },
                footer: (tooltipItems: any[]) => {
                  const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
                  return `Flujo Neto: ${this.formatCurrency(total)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: {
                font: { size: 11 },
                callback: (value: any) => this.formatCurrencyShort(Number(value)),
              },
            },
          },
        },
      };
    }

    // Line or Bar: one dataset per entity with color based on sign
    const datasets = series.map((s, index) => {
      // Create data array aligned with labels
      const dataMap = new Map(s.data.map(d => [d.period, d.value]));
      const data = labels.map(period => dataMap.get(period) || 0);

      // Determine color based on total value (income vs expense)
      const isIncome = s.total >= 0;
      const color = isIncome ? this.getIncomeColor(index) : this.getExpenseColor(index);

      return {
        label: s.label,
        data,
        borderColor: color,
        backgroundColor: this.hexToRgba(color, 0.1),
        borderWidth: 2,
        fill: this.selectedChartType === 'bar',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      type: this.selectedChartType,
      data: { labels, datasets },
      options: this.getLineBarChartOptions(),
    };
  }

  /**
   * Get common options for line/bar charts
   */
  private getLineBarChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: { display: false },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y ?? 0;
              return `${label}: ${this.formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            font: { size: 11 },
            callback: (value: any) => this.formatCurrencyShort(Number(value)),
          },
        },
      },
    };
  }

  /**
   * Get color from palette by index
   */
  private getColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
  }

  /**
   * Get income color (green tones)
   */
  private getIncomeColor(index: number): string {
    const incomeColors = [
      '#10b981', // emerald-500
      '#059669', // emerald-600
      '#34d399', // emerald-400
      '#6ee7b7', // emerald-300
      '#047857', // emerald-700
    ];
    return incomeColors[index % incomeColors.length];
  }

  /**
   * Get expense color (red tones)
   */
  private getExpenseColor(index: number): string {
    const expenseColors = [
      '#ef4444', // red-500
      '#dc2626', // red-600
      '#f87171', // red-400
      '#fca5a5', // red-300
      '#b91c1c', // red-700
    ];
    return expenseColors[index % expenseColors.length];
  }

  /**
   * Destroy existing chart
   */
  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Format currency in CLP
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Format currency in short form (K, M)
   */
  private formatCurrencyShort(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value}`;
    }
  }
}
