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
  CHART_COLORS,
} from '../../../../../../core/models/cost-explorer.model';

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
  @Input() loading = false;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  selectedChartType: ChartType = 'line';

  chartTypeOptions = [
    { value: 'line' as ChartType, label: 'Línea', icon: 'M7 10l5 5 5-5H7z' },
    { value: 'bar' as ChartType, label: 'Barras', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { value: 'pie' as ChartType, label: 'Torta', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
  ];

  ngAfterViewInit(): void {
    // Render chart after view init if we already have data
    if (this.timeSeriesData) {
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Render chart whenever timeSeriesData changes (including first change)
    if (changes['timeSeriesData'] && this.chartCanvas) {
      this.renderChart();
    }

    // Render chart when loading finishes (true -> false)
    // Use setTimeout to wait for Angular to render the canvas in the DOM
    if (changes['loading'] && !changes['loading'].currentValue && this.timeSeriesData) {
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
    if (!this.chartCanvas || !this.timeSeriesData) {
      return;
    }

    // Destroy existing chart
    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.timeSeriesData.series.map((point) => point.period);
    const incomeData = this.timeSeriesData.series.map((point) => point.income);
    const expenseData = this.timeSeriesData.series.map((point) => point.expense);
    const netData = this.timeSeriesData.series.map((point) => point.net);

    let config: ChartConfiguration;

    if (this.selectedChartType === 'pie') {
      // For pie chart, use total income and expense
      const totalIncome = incomeData.reduce((sum, val) => sum + val, 0);
      const totalExpense = expenseData.reduce((sum, val) => sum + val, 0);

      config = {
        type: 'pie',
        data: {
          labels: ['Ingresos', 'Gastos'],
          datasets: [
            {
              data: [totalIncome, totalExpense],
              backgroundColor: [CHART_COLORS.income, CHART_COLORS.expense],
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed ?? 0;
                  return `${label}: ${this.formatCurrency(value)}`;
                },
              },
            },
          },
        },
      };
    } else {
      // Line or Bar chart
      config = {
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: false,
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
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
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11,
              },
              callback: (value) => {
                return this.formatCurrencyShort(Number(value));
              },
            },
          },
        },
      },
    };
    }

    this.chart = new Chart(ctx, config);
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
