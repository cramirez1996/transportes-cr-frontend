import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionCategory,
  CreateTransactionCategoryDto,
  UpdateTransactionCategoryDto,
  TransactionFilters,
  TransactionStatistics,
  TransactionByCategory,
  TransactionType,
} from '../models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  // CRUD de Transacciones
  getTransactions(filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      if (filters.tripId) params = params.set('tripId', filters.tripId);
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.driverId) params = params.set('driverId', filters.driverId);
      if (filters.customerId) params = params.set('customerId', filters.customerId);
      if (filters.supplierId) params = params.set('supplierId', filters.supplierId);
      if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(transactions => transactions.map(t => this.mapTransactionFromBackend(t)))
    );
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(t => this.mapTransactionFromBackend(t))
    );
  }

  createTransaction(transactionData: CreateTransactionDto): Observable<Transaction> {
    const payload = this.mapTransactionToBackend(transactionData);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(t => this.mapTransactionFromBackend(t))
    );
  }

  updateTransaction(id: string, transactionData: UpdateTransactionDto): Observable<Transaction> {
    const payload = this.mapTransactionToBackend(transactionData);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(t => this.mapTransactionFromBackend(t))
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Estadísticas
  getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
  }): Observable<TransactionStatistics> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    }

    return this.http.get<TransactionStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  getByCategory(filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
  }): Observable<TransactionByCategory[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
      if (filters.type) params = params.set('type', filters.type);
    }

    return this.http.get<TransactionByCategory[]>(`${this.apiUrl}/by-category`, { params });
  }

  // CRUD de Categorías
  getCategories(type?: TransactionType): Observable<TransactionCategory[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http.get<any[]>(`${environment.apiUrl}/transaction-categories`, { params }).pipe(
      map(categories => categories.map(c => this.mapCategoryFromBackend(c)))
    );
  }

  getCategoryById(id: string): Observable<TransactionCategory> {
    return this.http.get<any>(`${environment.apiUrl}/transaction-categories/${id}`).pipe(
      map(c => this.mapCategoryFromBackend(c))
    );
  }

  createCategory(categoryData: CreateTransactionCategoryDto): Observable<TransactionCategory> {
    return this.http.post<any>(`${environment.apiUrl}/transaction-categories`, categoryData).pipe(
      map(c => this.mapCategoryFromBackend(c))
    );
  }

  updateCategory(id: string, categoryData: UpdateTransactionCategoryDto): Observable<TransactionCategory> {
    return this.http.patch<any>(`${environment.apiUrl}/transaction-categories/${id}`, categoryData).pipe(
      map(c => this.mapCategoryFromBackend(c))
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/transaction-categories/${id}`);
  }

  seedCategories(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/transaction-categories/seed`, {});
  }

  // Mappers
  private mapTransactionFromBackend(transaction: any): Transaction {
    return {
      id: transaction.id,
      type: transaction.type,
      category: transaction.category ? this.mapCategoryFromBackend(transaction.category) : null as any,
      amount: parseFloat(transaction.amount),
      date: new Date(transaction.date),
      description: transaction.description,
      trip: transaction.trip,
      invoice: transaction.invoice,
      vehicle: transaction.vehicle,
      driver: transaction.driver,
      customer: transaction.customer,
      supplier: transaction.supplier,
      paymentMethod: transaction.paymentMethod,
      referenceNumber: transaction.referenceNumber,
      attachments: transaction.attachments || [],
      createdBy: transaction.createdBy,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    };
  }

  private mapTransactionToBackend(transactionData: CreateTransactionDto | UpdateTransactionDto): any {
    const payload: any = { ...transactionData };

    if (transactionData.date) {
      payload.date = transactionData.date instanceof Date
        ? transactionData.date.toISOString()
        : transactionData.date;
    }

    return payload;
  }

  private mapCategoryFromBackend(category: any): TransactionCategory {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      parent: category.parent ? this.mapCategoryFromBackend(category.parent) : undefined,
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt),
    };
  }
}
