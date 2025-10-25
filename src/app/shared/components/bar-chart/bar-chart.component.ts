import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() labels: string[] = [];
  @Input() datasets: { label: string; data: number[]; backgroundColor?: string; borderColor?: string }[] = [];
  @Input() title: string = '';
  @Input() height: string = '300px';
  @Input() stacked: boolean = false;
  @Input() horizontal: boolean = false;
  @Input() format: 'currency' | 'number' = 'currency';
  @Input() xAxisType: 'category' | 'linear' = 'category';

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['labels'] || changes['datasets'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Format datasets with default colors
    const formattedDatasets = this.datasets.map((dataset, index) => {
      const defaultColors = [
        { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' }, // blue
        { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' }, // green
        { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' }, // yellow
        { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' }, // red
        { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)' }, // purple
        { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)' }, // pink
      ];

      const colorSet = defaultColors[index % defaultColors.length];

      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || colorSet.bg,
        borderColor: dataset.borderColor || colorSet.border,
        borderWidth: 1,
      };
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: formattedDatasets,
      },
      options: {
        indexAxis: this.horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.datasets.length > 1,
            position: 'bottom',
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null || context.parsed.x !== null) {
                  const value = this.horizontal ? context.parsed.x : context.parsed.y;
                  if (value !== null) {
                    if (this.format === 'currency') {
                      label += new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP',
                        minimumFractionDigits: 0,
                      }).format(value);
                    } else {
                      label += new Intl.NumberFormat('es-CL').format(value);
                    }
                  }
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            type: this.xAxisType,
            stacked: this.stacked,
            ticks: this.horizontal && this.format === 'currency' ? {
              callback: (value) => {
                return new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value as number);
              },
            } : undefined,
          },
          y: {
            stacked: this.stacked,
            beginAtZero: true,
            ticks: !this.horizontal && this.format === 'currency' ? {
              callback: (value) => {
                return new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value as number);
              },
            } : undefined,
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  updateChart(): void {
    if (this.chart) {
      this.chart.data.labels = this.labels;
      this.chart.data.datasets = this.datasets as any;
      this.chart.update();
    }
  }
}
