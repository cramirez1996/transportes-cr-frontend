// Analytics Models matching backend DTOs

export interface TripProfitability {
  tripId: string;
  route: string;
  customer: string;
  departureDate: Date;
  income: number;
  expenses: number;
  profit: number;
  profitMarginPercentage: number;
  status: string;
  totalKm: number;
}

export interface TripProfitabilitySummary {
  totalTrips: number;
  totalIncome: number;
  totalExpenses: number;
  totalProfit: number;
  avgProfitMarginPercentage: number;
  trips: TripProfitability[];
}

export interface MonthlyIncome {
  totalGross: number;
  totalNet: number;
  totalIvaDebito: number;
  invoiceCount: number;
}

export interface MonthlyExpenses {
  expensesWithInvoice: number;
  expensesNet: number;
  totalIvaCredito: number;
  expensesWithoutInvoice: number;
  totalExpenses: number;
  invoiceCount: number;
  transactionCount: number;
}

export interface IvaCalculation {
  debitoFiscal: number;
  creditoFiscal: number;
  ivaAPagar: number;
}

export interface MonthlyFinancialReport {
  month: string;
  income: MonthlyIncome;
  expenses: MonthlyExpenses;
  iva: IvaCalculation;
  netProfit: number;
  profitMarginPercentage: number;
}

export interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export interface ExpensesByCategoryReport {
  period: string;
  totalExpenses: number;
  categories: ExpenseByCategory[];
}

export interface DashboardKpis {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercentage: number;
  completedTrips: number;
  tripsInProgress: number;
  pendingTrips: number;
  activeCustomers: number;
  activeVehicles: number;
  activeDrivers: number;
  ivaBalance: number;
  issuedSaleInvoices: number;
  pendingSaleInvoices: number;
  avgTripProfitability: number;
  totalKilometers: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  profit: number;
  trips: number;
}

export interface DashboardTrends {
  monthlyTrends: MonthlyTrend[];
}

// Query parameters
export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
  month?: string;
}

// Monthly Invoice Trends
export interface MonthlyInvoiceTrend {
  month: string;
  saleInvoices: number;
  purchaseInvoices: number;
}

export interface MonthlyInvoiceTrends {
  monthlyInvoiceTrends: MonthlyInvoiceTrend[];
}

// Monthly IVA Trends
export interface MonthlyIvaTrend {
  month: string;
  debitoFiscal: number;
  creditoFiscal: number;
  ivaAPagar: number;
}

export interface MonthlyIvaTrends {
  monthlyIvaTrends: MonthlyIvaTrend[];
}

// Monthly Expenses By Category
export interface CategoryExpenseTrend {
  categoryId: string;
  categoryName: string;
  data: number[];
}

export interface MonthlyExpensesByCategory {
  months: string[];
  categories: CategoryExpenseTrend[];
}

// Vehicle Performance
export interface VehiclePerformance {
  vehicleId: string;
  vehicleName: string;
  income: number;
  expenses: number;
}

export interface VehiclePerformanceReport {
  month: string;
  vehicles: VehiclePerformance[];
}
