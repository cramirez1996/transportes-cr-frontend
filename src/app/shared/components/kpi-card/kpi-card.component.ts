import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: number | string = 0;
  @Input() icon: string = '📊';
  @Input() trend?: number; // percentage change (positive or negative)
  @Input() format: 'currency' | 'number' | 'percentage' = 'number';
  @Input() color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';
  @Input() loading: boolean = false;

  get formattedValue(): string {
    if (this.loading) return '...';

    const numValue = typeof this.value === 'string' ? parseFloat(this.value) : this.value;

    switch (this.format) {
      case 'currency':
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);

      case 'percentage':
        return `${numValue.toFixed(1)}%`;

      case 'number':
      default:
        return new Intl.NumberFormat('es-CL').format(numValue);
    }
  }

  get trendClass(): string {
    if (!this.trend) return '';
    return this.trend > 0 ? 'text-green-600' : 'text-red-600';
  }

  get trendIcon(): string {
    if (!this.trend) return '';
    return this.trend > 0 ? '↑' : '↓';
  }

  get colorClasses(): { bg: string; border: string; text: string } {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    };
    return colors[this.color];
  }
}
