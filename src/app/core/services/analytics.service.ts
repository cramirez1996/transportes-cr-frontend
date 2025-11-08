import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardKpis,
  DashboardTrends,
  TripProfitabilitySummary,
  MonthlyFinancialReport,
  MonthlyCashFlowReport,
  ExpensesByCategoryReport,
  DateRangeQuery,
  MonthlyInvoiceTrends,
  MonthlyIvaTrends,
  MonthlyExpensesByCategory,
  VehiclePerformanceReport,
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard KPIs for a specific month or current month
   */
  getDashboardKpis(month?: string): Observable<DashboardKpis> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<DashboardKpis>(`${this.apiUrl}/dashboard/kpis`, { params });
  }

  /**
   * Get monthly trends for charts
   */
  getMonthlyTrends(months: number = 6): Observable<DashboardTrends> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<DashboardTrends>(`${this.apiUrl}/dashboard/trends`, { params });
  }

  /**
   * Get trip profitability analysis
   */
  getTripProfitability(query: DateRangeQuery = {}): Observable<TripProfitabilitySummary> {
    let params = new HttpParams();
    if (query.startDate) {
      params = params.set('startDate', query.startDate);
    }
    if (query.endDate) {
      params = params.set('endDate', query.endDate);
    }
    if (query.month) {
      params = params.set('month', query.month);
    }
    return this.http.get<TripProfitabilitySummary>(`${this.apiUrl}/trips/profitability`, { params });
  }

  /**
   * Get monthly financial report (income, expenses, IVA, profit)
   */
  getMonthlyFinancialReport(month: string): Observable<MonthlyFinancialReport> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlyFinancialReport>(`${this.apiUrl}/financial/monthly-report`, { params });
  }

  /**
   * Get monthly cash flow report (only PAID invoices and cash transactions)
   */
  getMonthlyCashFlowReport(month: string): Observable<MonthlyCashFlowReport> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlyCashFlowReport>(`${this.apiUrl}/financial/cash-flow-report`, { params });
  }

  /**
   * Get expenses breakdown by category
   */
  getExpensesByCategory(query: DateRangeQuery = {}): Observable<ExpensesByCategoryReport> {
    let params = new HttpParams();
    if (query.startDate) {
      params = params.set('startDate', query.startDate);
    }
    if (query.endDate) {
      params = params.set('endDate', query.endDate);
    }
    if (query.month) {
      params = params.set('month', query.month);
    }
    return this.http.get<ExpensesByCategoryReport>(`${this.apiUrl}/expenses/by-category`, { params });
  }

  /**
   * Helper: Get current month in ISO format (YYYY-MM-01)
   */
  getCurrentMonthISO(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  /**
   * Helper: Get previous month in ISO format
   */
  getPreviousMonthISO(): string {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  /**
   * Helper: Format month for display (e.g., "Enero 2025")
   */
  formatMonthDisplay(monthISO: string): string {
    // Parse YYYY-MM-DD manually to avoid timezone issues
    const [year, month] = monthISO.split('-').map(Number);
    const date = new Date(year, month - 1, 1); // month is 0-indexed
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  /**
   * Get monthly invoice trends (issued sale invoices and received purchase invoices)
   */
  getMonthlyInvoiceTrends(months: number = 6): Observable<MonthlyInvoiceTrends> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<MonthlyInvoiceTrends>(`${this.apiUrl}/dashboard/invoice-trends`, { params });
  }

  /**
   * Get monthly IVA trends
   */
  getMonthlyIvaTrends(months: number = 6): Observable<MonthlyIvaTrends> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<MonthlyIvaTrends>(`${this.apiUrl}/dashboard/iva-trends`, { params });
  }

  /**
   * Get monthly expenses by category trends
   */
  getMonthlyExpensesByCategory(months: number = 6): Observable<MonthlyExpensesByCategory> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<MonthlyExpensesByCategory>(`${this.apiUrl}/dashboard/expenses-by-category-trends`, { params });
  }

  /**
   * Get vehicle performance (income and expenses per vehicle)
   */
  getVehiclePerformance(month?: string): Observable<VehiclePerformanceReport> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<VehiclePerformanceReport>(`${this.apiUrl}/dashboard/vehicle-performance`, { params });
  }
}
