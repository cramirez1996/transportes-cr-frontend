import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Driver, CreateDriverDto } from '../../models/business/driver.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/drivers`;

  getDrivers(): Observable<Driver[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(drivers => drivers.map(this.transformDriver))
    );
  }

  getDriverById(id: string): Observable<Driver> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(this.transformDriver)
    );
  }

  createDriver(dto: CreateDriverDto): Observable<Driver> {
    const payload = this.transformToBackend(dto);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(this.transformDriver)
    );
  }

  updateDriver(id: string, dto: Partial<CreateDriverDto>): Observable<Driver> {
    const payload = this.transformToBackend(dto);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(this.transformDriver)
    );
  }

  deleteDriver(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private transformDriver(driver: any): Driver {
    return {
      id: driver.id,
      rut: driver.rut,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry) : undefined,
      status: driver.status?.toLowerCase() || 'active',
      hireDate: new Date(driver.hireDate),
      tags: driver.tags || {},
      totalTrips: driver.totalTrips || 0
    };
  }

  private transformToBackend(dto: Partial<CreateDriverDto>): any {
    return {
      rut: dto.rut,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      licenseNumber: dto.licenseNumber,
      licenseType: dto.licenseType,
      licenseExpiry: dto.licenseExpiry,
      hireDate: dto.hireDate,
      tags: dto.tags
    };
  }
}
