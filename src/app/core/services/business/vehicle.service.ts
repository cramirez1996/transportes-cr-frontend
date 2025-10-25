import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Vehicle, CreateVehicleDto } from '../../models/business/vehicle.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vehicles`;

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(vehicles => vehicles.map(this.transformVehicle))
    );
  }

  getVehicleById(id: string): Observable<Vehicle> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(this.transformVehicle)
    );
  }

  createVehicle(dto: CreateVehicleDto): Observable<Vehicle> {
    const payload = this.transformToBackend(dto);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(this.transformVehicle)
    );
  }

  updateVehicle(id: string, dto: Partial<CreateVehicleDto>): Observable<Vehicle> {
    const payload = this.transformToBackend(dto);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(this.transformVehicle)
    );
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private transformVehicle(vehicle: any): Vehicle {
    return {
      id: vehicle.id,
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      type: vehicle.type.toLowerCase(),
      capacity: Number(vehicle.capacity),
      status: vehicle.status.toLowerCase(),
      mileage: vehicle.mileage,
      tags: vehicle.tags || {},
      createdAt: new Date(vehicle.createdAt),
      updatedAt: new Date(vehicle.updatedAt)
    };
  }

  private transformToBackend(dto: Partial<CreateVehicleDto>): any {
    return {
      licensePlate: dto.licensePlate,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      type: dto.type?.toUpperCase(),
      capacity: dto.capacity,
      mileage: dto.mileage,
      tags: dto.tags
    };
  }
}
