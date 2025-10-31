import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AggregateResult,
  GroupByDimension,
} from '../../../../../../core/models/transaction-explorer.model';

@Component({
  selector: 'app-breakdown-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breakdown-table.component.html',
  styleUrls: ['./breakdown-table.component.scss'],
})
export class BreakdownTableComponent {
  @Input() data: AggregateResult | null = null;
  @Input() loading = false;
  @Input() dimension: GroupByDimension = GroupByDimension.CATEGORY;

  constructor(private router: Router) {}

  /**
   * Format currency in CLP
   * Shows absolute value with sign indicator
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Get percentage bar width
   */
  getBarWidth(percentage: number): string {
    return `${Math.min(Math.abs(percentage), 100)}%`;
  }

  /**
   * Check if value is income (positive)
   */
  isIncome(value: number): boolean {
    return value >= 0;
  }

  /**
   * Handle drill-down to transactions
   */
  drillDown(group: any): void {
    // Navigate to transaction list with filters
    const queryParams: any = {};

    switch (this.dimension) {
      case GroupByDimension.CATEGORY:
        queryParams.categoryId = group.key;
        break;
      case GroupByDimension.VEHICLE:
        queryParams.vehicleId = group.key;
        break;
      case GroupByDimension.DRIVER:
        queryParams.driverId = group.key;
        break;
      case GroupByDimension.CUSTOMER:
        queryParams.customerId = group.key;
        break;
      case GroupByDimension.SUPPLIER:
        queryParams.supplierId = group.key;
        break;
      case GroupByDimension.TYPE:
        queryParams.type = group.key;
        break;
      case GroupByDimension.PAYMENT_METHOD:
        queryParams.paymentMethod = group.key;
        break;
    }

    this.router.navigate(['/admin/accounting/transactions'], { queryParams });
  }

  /**
   * Get bar color based on value (green for income, red for expense)
   */
  getBarColor(value: number): string {
    if (value >= 0) {
      // Income - green
      return 'bg-emerald-500';
    } else {
      // Expense - red
      return 'bg-red-500';
    }
  }

  /**
   * Get text color based on value
   */
  getTextColor(value: number): string {
    if (value >= 0) {
      return 'text-emerald-600';
    } else {
      return 'text-red-600';
    }
  }
}
