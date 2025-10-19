import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../models/supplier.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/suppliers`;

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(suppliers => suppliers.map(s => this.mapSupplierFromBackend(s)))
    );
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(s => this.mapSupplierFromBackend(s))
    );
  }

  createSupplier(supplierData: CreateSupplierDto): Observable<Supplier> {
    return this.http.post<any>(this.apiUrl, supplierData).pipe(
      map(s => this.mapSupplierFromBackend(s))
    );
  }

  updateSupplier(id: string, supplierData: UpdateSupplierDto): Observable<Supplier> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, supplierData).pipe(
      map(s => this.mapSupplierFromBackend(s))
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Mapper
  private mapSupplierFromBackend(supplier: any): Supplier {
    return {
      id: supplier.id,
      rut: supplier.rut,
      businessName: supplier.businessName,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      region: supplier.region,
      supplierType: supplier.supplierType,
      status: supplier.status,
      createdAt: new Date(supplier.createdAt),
      updatedAt: new Date(supplier.updatedAt),
    };
  }
}
