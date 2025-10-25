import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CostExplorerService } from '../../../../core/services/cost-explorer.service';
import {
  ExplorerFilters,
  GroupByDimension,
  TimeGranularity,
  TransactionTypeFilter,
  DatePreset,
  AggregateResult,
  TimeSeriesResult,
  ComparisonResult,
  MetricCardData,
  CHART_COLORS,
} from '../../../../core/models/cost-explorer.model';
import { MetricCardsComponent } from './components/metric-cards/metric-cards.component';
import { ChartSectionComponent } from './components/chart-section/chart-section.component';
import { BreakdownTableComponent } from './components/breakdown-table/breakdown-table.component';
import { EntityMultiSelectComponent } from './components/entity-multi-select/entity-multi-select.component';

@Component({
  selector: 'app-cost-explorer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MetricCardsComponent,
    ChartSectionComponent,
    BreakdownTableComponent,
    EntityMultiSelectComponent,
  ],
  templateUrl: './cost-explorer.component.html',
  styleUrls: ['./cost-explorer.component.scss'],
})
export class CostExplorerComponent implements OnInit, OnDestroy {
  // Loading states
  isLoadingMetrics = false;
  isLoadingChart = false;
  isLoadingBreakdown = false;

  // Data
  metricCards: MetricCardData[] = [];
  timeSeriesData: TimeSeriesResult | null = null;
  aggregateData: AggregateResult | null = null;
  comparisonData: ComparisonResult | null = null;

  // Filters (reactive form will sync with this)
  filters: ExplorerFilters = {
    dateRange: {
      start: this.getLast30DaysStart(),
      end: new Date(),
      preset: DatePreset.LAST_30_DAYS,
    },
    compareEnabled: false,
    groupBy: GroupByDimension.CATEGORY,
  };

  // Reactive Form
  filtersForm!: FormGroup;

  // UI state
  showFilters = false;

  // Date inputs (synced with form)
  selectedPreset = 'last30days';
  startDateStr = '';
  endDateStr = '';

  // Advanced filter inputs (synced with form)
  selectedType = 'all';
  selectedPaymentMethod = 'all';
  selectedCategoryIds: string[] = [];
  selectedVehicleIds: string[] = [];
  selectedDriverIds: string[] = [];
  selectedCustomerIds: string[] = [];
  selectedSupplierIds: string[] = [];

  // Destroy subject for unsubscribing
  private destroy$ = new Subject<void>();

  constructor(
    private costExplorerService: CostExplorerService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDateInputs();
    this.setupFormListeners();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive form
   */
  initializeForm(): void {
    this.filtersForm = this.fb.group({
      preset: [this.selectedPreset],
      startDate: [this.formatDate(this.filters.dateRange.start)],
      endDate: [this.formatDate(this.filters.dateRange.end)],
      compareEnabled: [this.filters.compareEnabled],
      groupBy: [this.filters.groupBy],
      type: [this.selectedType],
      paymentMethod: [this.selectedPaymentMethod],
      categoryIds: [this.selectedCategoryIds],
      vehicleIds: [this.selectedVehicleIds],
      driverIds: [this.selectedDriverIds],
      customerIds: [this.selectedCustomerIds],
      supplierIds: [this.selectedSupplierIds],
    });
  }

  /**
   * Setup form value change listeners
   */
  setupFormListeners(): void {
    // Listen to all form changes with debounce
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((formValue) => {
        this.syncFormToFilters(formValue);
        this.loadAllData();
      });
  }

  /**
   * Sync form values to filters object
   */
  syncFormToFilters(formValue: any): void {
    // Update date inputs
    this.selectedPreset = formValue.preset;
    this.startDateStr = formValue.startDate;
    this.endDateStr = formValue.endDate;

    // Update dates
    if (formValue.startDate && formValue.endDate) {
      this.filters.dateRange.start = new Date(formValue.startDate);
      this.filters.dateRange.end = new Date(formValue.endDate);
    }

    // Update compare
    this.filters.compareEnabled = formValue.compareEnabled;
    if (this.filters.compareEnabled) {
      const duration =
        this.filters.dateRange.end.getTime() -
        this.filters.dateRange.start.getTime();
      this.filters.compareDateRange = {
        start: new Date(this.filters.dateRange.start.getTime() - duration),
        end: new Date(this.filters.dateRange.end.getTime() - duration),
      };
    } else {
      this.filters.compareDateRange = undefined;
    }

    // Update group by
    this.filters.groupBy = formValue.groupBy;

    // Update advanced filters
    this.selectedType = formValue.type;
    this.selectedPaymentMethod = formValue.paymentMethod;
    this.selectedCategoryIds = formValue.categoryIds || [];
    this.selectedVehicleIds = formValue.vehicleIds || [];
    this.selectedDriverIds = formValue.driverIds || [];
    this.selectedCustomerIds = formValue.customerIds || [];
    this.selectedSupplierIds = formValue.supplierIds || [];

    this.filters.type =
      formValue.type !== 'all' ? formValue.type : undefined;
    this.filters.paymentMethod =
      formValue.paymentMethod !== 'all' ? formValue.paymentMethod : undefined;
    this.filters.categoryIds =
      formValue.categoryIds?.length > 0 ? formValue.categoryIds : undefined;
    this.filters.vehicleIds =
      formValue.vehicleIds?.length > 0 ? formValue.vehicleIds : undefined;
    this.filters.driverIds =
      formValue.driverIds?.length > 0 ? formValue.driverIds : undefined;
    this.filters.customerIds =
      formValue.customerIds?.length > 0 ? formValue.customerIds : undefined;
    this.filters.supplierIds =
      formValue.supplierIds?.length > 0 ? formValue.supplierIds : undefined;
  }

  /**
   * Initialize date input strings from filters
   */
  initializeDateInputs(): void {
    this.startDateStr = this.formatDate(this.filters.dateRange.start);
    this.endDateStr = this.formatDate(this.filters.dateRange.end);
  }

  /**
   * Load all data (metrics, chart, breakdown)
   */
  loadAllData(): void {
    this.loadMetrics();
    this.loadTimeSeries();
    this.loadAggregate();

    if (this.filters.compareEnabled && this.filters.compareDateRange) {
      this.loadComparison();
    }
  }

  /**
   * Load metrics for cards
   */
  loadMetrics(): void {
    this.isLoadingMetrics = true;

    const startDate = this.formatDate(this.filters.dateRange.start);
    const endDate = this.formatDate(this.filters.dateRange.end);

    // Get aggregate for income
    this.costExplorerService
      .getAggregate({
        groupBy: GroupByDimension.TYPE,
        startDate,
        endDate,
        type: TransactionTypeFilter.INCOME,
      })
      .subscribe({
        next: (incomeResult) => {
          const incomeTotal = incomeResult.total;

          // Get aggregate for expenses
          this.costExplorerService
            .getAggregate({
              groupBy: GroupByDimension.TYPE,
              startDate,
              endDate,
              type: TransactionTypeFilter.EXPENSE,
            })
            .subscribe({
              next: (expenseResult) => {
                const expenseTotal = expenseResult.total;
                const netTotal = incomeTotal - expenseTotal;

                this.metricCards = [
                  {
                    label: 'Ingresos Totales',
                    value: incomeTotal,
                    icon: 'income',
                    color: CHART_COLORS.income,
                  },
                  {
                    label: 'Gastos Totales',
                    value: expenseTotal,
                    icon: 'expense',
                    color: CHART_COLORS.expense,
                  },
                  {
                    label: 'Balance Neto',
                    value: netTotal,
                    icon: 'net',
                    color: CHART_COLORS.net,
                  },
                ];

                this.isLoadingMetrics = false;
              },
              error: (error) => {
                console.error('Error loading expense metrics:', error);
                this.isLoadingMetrics = false;
              },
            });
        },
        error: (error) => {
          console.error('Error loading income metrics:', error);
          this.isLoadingMetrics = false;
        },
      });
  }

  /**
   * Load time series data for chart
   */
  loadTimeSeries(): void {
    this.isLoadingChart = true;

    const params = {
      granularity: this.getGranularity(),
      startDate: this.formatDate(this.filters.dateRange.start),
      endDate: this.formatDate(this.filters.dateRange.end),
      type: this.filters.type,
      categoryId: this.filters.categoryIds?.[0],
      vehicleId: this.filters.vehicleIds?.[0],
      driverId: this.filters.driverIds?.[0],
      customerId: this.filters.customerIds?.[0],
      supplierId: this.filters.supplierIds?.[0],
      paymentMethod: this.filters.paymentMethod,
    };

    this.costExplorerService.getTimeSeries(params).subscribe({
      next: (data) => {
        this.timeSeriesData = data;
        this.isLoadingChart = false;
      },
      error: (error) => {
        console.error('Error loading time series:', error);
        this.isLoadingChart = false;
      },
    });
  }

  /**
   * Load aggregate data for breakdown table
   */
  loadAggregate(): void {
    this.isLoadingBreakdown = true;

    const params = {
      groupBy: this.filters.groupBy,
      startDate: this.formatDate(this.filters.dateRange.start),
      endDate: this.formatDate(this.filters.dateRange.end),
      type: this.filters.type,
      categoryId: this.filters.categoryIds?.[0],
      vehicleId: this.filters.vehicleIds?.[0],
      driverId: this.filters.driverIds?.[0],
      customerId: this.filters.customerIds?.[0],
      supplierId: this.filters.supplierIds?.[0],
      paymentMethod: this.filters.paymentMethod,
    };

    this.costExplorerService.getAggregate(params).subscribe({
      next: (data) => {
        this.aggregateData = data;
        this.isLoadingBreakdown = false;
      },
      error: (error) => {
        console.error('Error loading aggregate:', error);
        this.isLoadingBreakdown = false;
      },
    });
  }

  /**
   * Load comparison data
   */
  loadComparison(): void {
    if (!this.filters.compareDateRange) return;

    const params = {
      currentStart: this.formatDate(this.filters.dateRange.start),
      currentEnd: this.formatDate(this.filters.dateRange.end),
      previousStart: this.formatDate(this.filters.compareDateRange.start),
      previousEnd: this.formatDate(this.filters.compareDateRange.end),
      groupBy: this.filters.groupBy,
    };

    this.costExplorerService.comparePeriods(params).subscribe({
      next: (data) => {
        this.comparisonData = data;

        // Update metric cards with comparison
        this.updateMetricCardsWithComparison(data);
      },
      error: (error) => {
        console.error('Error loading comparison:', error);
      },
    });
  }

  /**
   * Update metric cards with comparison data
   */
  updateMetricCardsWithComparison(comparison: ComparisonResult): void {
    this.metricCards = [
      {
        label: 'Ingresos Totales',
        value: comparison.current.income,
        change: {
          amount: comparison.change.incomeAmount,
          percentage: comparison.change.incomePercentage,
          isPositive: comparison.change.incomeAmount >= 0,
        },
        icon: 'income',
        color: CHART_COLORS.income,
      },
      {
        label: 'Gastos Totales',
        value: comparison.current.expense,
        change: {
          amount: comparison.change.expenseAmount,
          percentage: comparison.change.expensePercentage,
          isPositive: comparison.change.expenseAmount < 0, // Less expenses is positive
        },
        icon: 'expense',
        color: CHART_COLORS.expense,
      },
      {
        label: 'Balance Neto',
        value: comparison.current.income - comparison.current.expense,
        change: {
          amount: comparison.change.incomeAmount - comparison.change.expenseAmount,
          percentage:
            ((comparison.current.income - comparison.current.expense -
              (comparison.previous.income - comparison.previous.expense)) *
              100) /
            (comparison.previous.income - comparison.previous.expense || 1),
          isPositive:
            comparison.current.income - comparison.current.expense >=
            comparison.previous.income - comparison.previous.expense,
        },
        icon: 'net',
        color: CHART_COLORS.net,
      },
    ];
  }

  /**
   * Handle date range change
   */
  onDateRangeChange(dateRange: {
    start: Date;
    end: Date;
    preset?: DatePreset;
  }): void {
    this.filters.dateRange = dateRange;
    this.loadAllData();
  }

  /**
   * Handle comparison toggle
   */
  onCompareToggle(enabled: boolean): void {
    this.filters.compareEnabled = enabled;

    if (enabled) {
      // Calculate previous period (same duration, shifted back)
      const duration =
        this.filters.dateRange.end.getTime() -
        this.filters.dateRange.start.getTime();
      this.filters.compareDateRange = {
        start: new Date(this.filters.dateRange.start.getTime() - duration),
        end: new Date(this.filters.dateRange.end.getTime() - duration),
      };
      this.loadComparison();
    } else {
      this.filters.compareDateRange = undefined;
      this.comparisonData = null;
      this.loadMetrics(); // Reload without comparison
    }
  }

  /**
   * Handle group by change (called from template)
   */
  onGroupByChange(groupBy: GroupByDimension): void {
    // Update form control (valueChanges will handle the rest)
    this.filtersForm.patchValue({ groupBy }, { emitEvent: true });
  }

  /**
   * Handle filters change
   */
  onFiltersChange(filters: Partial<ExplorerFilters>): void {
    this.filters = { ...this.filters, ...filters };
    this.loadAllData();
  }

  /**
   * Toggle filter panel
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filters = {
      dateRange: {
        start: this.getLast30DaysStart(),
        end: new Date(),
        preset: DatePreset.LAST_30_DAYS,
      },
      compareEnabled: false,
      groupBy: GroupByDimension.CATEGORY,
    };
    this.loadAllData();
  }

  // ============= HELPER METHODS =============

  /**
   * Get granularity based on date range
   */
  private getGranularity(): TimeGranularity {
    const daysDiff = Math.ceil(
      (this.filters.dateRange.end.getTime() -
        this.filters.dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 31) {
      return TimeGranularity.DAY;
    } else if (daysDiff <= 90) {
      return TimeGranularity.WEEK;
    } else if (daysDiff <= 365) {
      return TimeGranularity.MONTH;
    } else {
      return TimeGranularity.YEAR;
    }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date 30 days ago
   */
  private getLast30DaysStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }

  /**
   * Get dimension label in Spanish
   */
  getDimensionLabel(dimension: GroupByDimension): string {
    const labels: Record<GroupByDimension, string> = {
      [GroupByDimension.CATEGORY]: 'Categoría',
      [GroupByDimension.TYPE]: 'Tipo',
      [GroupByDimension.PAYMENT_METHOD]: 'Método de Pago',
      [GroupByDimension.SUPPLIER]: 'Proveedor',
      [GroupByDimension.VEHICLE]: 'Vehículo',
      [GroupByDimension.DRIVER]: 'Conductor',
      [GroupByDimension.CUSTOMER]: 'Cliente',
    };
    return labels[dimension] || dimension;
  }

  /**
   * Handle preset change
   */
  onPresetChange(): void {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    const preset = this.filtersForm.get('preset')?.value;

    switch (preset) {
      case 'last7days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case 'last90days':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        return; // Don't update dates for custom
      default:
        start = this.getLast30DaysStart();
    }

    // Update form (which will trigger valueChanges)
    this.filtersForm.patchValue({
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    }, { emitEvent: true });
  }

  /**
   * Handle custom date change
   */
  onCustomDateChange(): void {
    // Update preset to custom when dates are manually changed
    this.filtersForm.patchValue({
      preset: 'custom',
    }, { emitEvent: true });
  }

  /**
   * Reset advanced filters
   */
  resetAdvancedFilters(): void {
    this.filtersForm.patchValue({
      type: 'all',
      paymentMethod: 'all',
      categoryIds: [],
      vehicleIds: [],
      driverIds: [],
      customerIds: [],
      supplierIds: [],
    }, { emitEvent: true });
  }
}
