import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AggregateQueryParams,
  AggregateResult,
  TimeSeriesQueryParams,
  TimeSeriesResult,
  ComparePeriodParams,
  ComparisonResult,
  TopQueryParams,
  TopResult,
  ProfitabilityQueryParams,
  ProfitabilityResult,
  DrillDownQueryParams,
  DrillDownResult,
  SearchQueryParams,
  SearchResult,
  GroupedTimeSeriesQueryParams,
  GroupedTimeSeriesResult,
} from '../models/transaction-explorer.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionExplorerService {
  private readonly apiUrl = `${environment.apiUrl}/analytics/transaction-explorer`;

  constructor(private http: HttpClient) {}

  /**
   * Get aggregated data by dimension
   */
  getAggregate(params: AggregateQueryParams): Observable<AggregateResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AggregateResult>(`${this.apiUrl}/aggregate`, {
      params: httpParams,
    });
  }

  /**
   * Get time series data
   */
  getTimeSeries(params: TimeSeriesQueryParams): Observable<TimeSeriesResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<TimeSeriesResult>(`${this.apiUrl}/time-series`, {
      params: httpParams,
    });
  }

  /**
   * Compare two periods
   */
  comparePeriods(params: ComparePeriodParams): Observable<ComparisonResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ComparisonResult>(`${this.apiUrl}/compare`, {
      params: httpParams,
    });
  }

  /**
   * Get top N items by dimension
   */
  getTop(params: TopQueryParams): Observable<TopResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<TopResult>(`${this.apiUrl}/top`, { params: httpParams });
  }

  /**
   * Get profitability analysis
   */
  getProfitability(
    params: ProfitabilityQueryParams,
  ): Observable<ProfitabilityResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ProfitabilityResult>(`${this.apiUrl}/profitability`, {
      params: httpParams,
    });
  }

  /**
   * Get drill-down transactions
   */
  getDrillDown(params: DrillDownQueryParams): Observable<DrillDownResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<DrillDownResult>(`${this.apiUrl}/drill-down`, {
      params: httpParams,
    });
  }

  /**
   * Search entities for filter dropdowns
   */
  search(params: SearchQueryParams): Observable<SearchResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<SearchResult>(`${this.apiUrl}/search`, {
      params: httpParams,
    });
  }

  /**
   * Get grouped time series (one series per entity)
   */
  getGroupedTimeSeries(params: GroupedTimeSeriesQueryParams): Observable<GroupedTimeSeriesResult> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<GroupedTimeSeriesResult>(`${this.apiUrl}/time-series-grouped`, {
      params: httpParams,
    });
  }

  /**
   * Helper: Build HTTP params from object
   * Handles both single values and arrays
   */
  private buildHttpParams(params: any): HttpParams {
    let httpParams = new HttpParams();

    console.log('buildHttpParams - Input params:', params);

    Object.keys(params).forEach((key) => {
      const value = params[key];

      if (value === undefined || value === null || value === '') {
        return;
      }

      // Handle arrays (for multiple IDs)
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // Append each value separately with the same key
          value.forEach((item) => {
            httpParams = httpParams.append(key, item.toString());
          });
        }
      } else {
        // Handle single values
        httpParams = httpParams.set(key, value.toString());
      }
    });

    console.log('buildHttpParams - Output params:', httpParams.toString());
    return httpParams;
  }
}
