/**
 * Cost Explorer Models
 * Frontend models matching backend DTOs
 */

// ===================== ENUMS =====================

export enum GroupByDimension {
  CATEGORY = 'category',
  TYPE = 'type',
  PAYMENT_METHOD = 'paymentMethod',
  SUPPLIER = 'supplier',
  VEHICLE = 'vehicle',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
}

export enum TimeGranularity {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum TransactionTypeFilter {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum DatePreset {
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
  THIS_YEAR = 'thisYear',
  CUSTOM = 'custom',
}

// ===================== REQUEST MODELS =====================

export interface ExplorerFilters {
  // Temporal
  dateRange: {
    start: Date;
    end: Date;
    preset?: DatePreset;
  };

  // Comparison
  compareEnabled: boolean;
  compareDateRange?: {
    start: Date;
    end: Date;
  };

  // Transaction filters
  type?: TransactionTypeFilter;
  paymentMethod?: string;
  categoryIds?: string[];

  // Entity filters
  vehicleIds?: string[];
  driverIds?: string[];
  customerIds?: string[];
  supplierIds?: string[];

  // Grouping
  groupBy: GroupByDimension;
}

export interface AggregateQueryParams {
  groupBy: GroupByDimension;
  startDate?: string;
  endDate?: string;
  type?: TransactionTypeFilter;
  categoryIds?: string[];
  vehicleIds?: string[];
  driverIds?: string[];
  customerIds?: string[];
  supplierIds?: string[];
  paymentMethod?: string;
}

export interface TimeSeriesQueryParams {
  granularity: TimeGranularity;
  startDate: string;
  endDate: string;
  type?: TransactionTypeFilter;
  categoryIds?: string[];
  vehicleIds?: string[];
  driverIds?: string[];
  customerIds?: string[];
  supplierIds?: string[];
  paymentMethod?: string;
}

export interface ComparePeriodParams {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  groupBy?: GroupByDimension;
}

export interface TopQueryParams {
  dimension: GroupByDimension;
  type: TransactionTypeFilter;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProfitabilityQueryParams {
  dimension: 'vehicle' | 'driver' | 'customer';
  startDate?: string;
  endDate?: string;
}

export interface DrillDownQueryParams {
  categoryIds?: string[];
  vehicleIds?: string[];
  driverIds?: string[];
  customerIds?: string[];
  supplierIds?: string[];
  type?: TransactionTypeFilter;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ===================== RESPONSE MODELS =====================

export interface AggregateGroup {
  key: string;
  label: string;
  value: number;
  count: number;
  percentage: number;
}

export interface AggregateResult {
  groups: AggregateGroup[];
  total: number;
  count: number;
  period: string;
}

export interface TimeSeriesDataPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface TimeSeriesResult {
  series: TimeSeriesDataPoint[];
  granularity: string;
  startDate: string;
  endDate: string;
}

export interface PeriodSummary {
  total: number;
  income: number;
  expense: number;
  count: number;
  groups?: AggregateGroup[];
}

export interface PeriodChange {
  totalAmount: number;
  totalPercentage: number;
  incomeAmount: number;
  incomePercentage: number;
  expenseAmount: number;
  expensePercentage: number;
}

export interface ComparisonResult {
  current: PeriodSummary;
  previous: PeriodSummary;
  change: PeriodChange;
}

export interface TopItem {
  id: string;
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TopResult {
  dimension: string;
  type: string;
  items: TopItem[];
  total: number;
  period: string;
}

export interface ProfitabilityItem {
  id: string;
  name: string;
  income: number;
  expense: number;
  profit: number;
  margin: number;
  count: number;
  tripCount?: number;
}

export interface ProfitabilityResult {
  dimension: string;
  items: ProfitabilityItem[];
  period: string;
}

export interface DrillDownResult {
  transactions: any[]; // Transaction entities
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== UI HELPER MODELS =====================

export interface MetricCardData {
  label: string;
  value: number;
  change?: {
    amount: number;
    percentage: number;
    isPositive: boolean;
  };
  icon: string;
  color: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
}

export interface SavedView {
  id: string;
  name: string;
  filters: ExplorerFilters;
  createdAt: Date;
}

// ===================== CHART COLOR PALETTES =====================

export const CHART_COLORS = {
  income: '#10b981', // green
  expense: '#ef4444', // red
  net: '#3b82f6', // blue
  primary: '#6366f1', // indigo
  secondary: '#8b5cf6', // purple
  warning: '#f59e0b', // amber
  info: '#06b6d4', // cyan
  success: '#22c55e', // green
  danger: '#dc2626', // red
};

export const CHART_PALETTE = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
];

// ===================== DIMENSION LABELS =====================

export const DIMENSION_LABELS: Record<GroupByDimension, string> = {
  [GroupByDimension.CATEGORY]: 'Categoría',
  [GroupByDimension.TYPE]: 'Tipo',
  [GroupByDimension.PAYMENT_METHOD]: 'Método de Pago',
  [GroupByDimension.SUPPLIER]: 'Proveedor',
  [GroupByDimension.VEHICLE]: 'Vehículo',
  [GroupByDimension.DRIVER]: 'Conductor',
  [GroupByDimension.CUSTOMER]: 'Cliente',
};

export const GRANULARITY_LABELS: Record<TimeGranularity, string> = {
  [TimeGranularity.DAY]: 'Día',
  [TimeGranularity.WEEK]: 'Semana',
  [TimeGranularity.MONTH]: 'Mes',
  [TimeGranularity.YEAR]: 'Año',
};

export const PRESET_LABELS: Record<DatePreset, string> = {
  [DatePreset.LAST_7_DAYS]: 'Últimos 7 días',
  [DatePreset.LAST_30_DAYS]: 'Últimos 30 días',
  [DatePreset.THIS_MONTH]: 'Este mes',
  [DatePreset.LAST_MONTH]: 'Mes pasado',
  [DatePreset.THIS_YEAR]: 'Este año',
  [DatePreset.CUSTOM]: 'Personalizado',
};

// ===================== SEARCH MODELS =====================

export type SearchEntityType =
  | 'categories'
  | 'vehicles'
  | 'drivers'
  | 'customers'
  | 'suppliers';

export interface SearchQueryParams {
  entity: SearchEntityType;
  q?: string;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  label: string;
  metadata?: any;
}

export interface SearchResult {
  entity: string;
  items: SearchResultItem[];
  total: number;
}
