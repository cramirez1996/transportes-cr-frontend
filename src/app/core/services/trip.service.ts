import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trip, CreateTripDto, UpdateTripDto, TripStatus } from '../models/trip.model';
import { environment } from '../../../environments/environment';

interface TripBackendResponse {
  id: string;
  customer: any;
  vehicle: any;
  driver: any;
  origin: string;
  destination: string;
  startKm?: number;
  endKm?: number | null;
  totalKm?: number | null;
  departureDate: string;
  arrivalDate?: string | null;
  isArrivalManual: boolean;
  agreedPrice: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trips`;

  // CRUD de Viajes
  getTrips(): Observable<Trip[]> {
    return this.http.get<TripBackendResponse[]>(this.apiUrl).pipe(
      map(trips => trips.map(trip => this.mapTripFromBackend(trip)))
    );
  }

  getTripById(id: string): Observable<Trip> {
    return this.http.get<TripBackendResponse>(`${this.apiUrl}/${id}`).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  createTrip(tripData: CreateTripDto): Observable<Trip> {
    const payload = this.mapTripToBackend(tripData);
    return this.http.post<TripBackendResponse>(this.apiUrl, payload).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  updateTrip(id: string, tripData: UpdateTripDto): Observable<Trip> {
    const payload = this.mapTripToBackend(tripData);
    return this.http.patch<TripBackendResponse>(`${this.apiUrl}/${id}`, payload).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Acciones específicas de viajes
  startTrip(id: string, startKm?: number): Observable<Trip> {
    return this.http.patch<TripBackendResponse>(`${this.apiUrl}/${id}/start`, { startKm }).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  completeTrip(id: string, endKm?: number, arrivalDate?: Date, isManual?: boolean): Observable<Trip> {
    return this.http.patch<TripBackendResponse>(`${this.apiUrl}/${id}/complete`, {
      endKm,
      arrivalDate: arrivalDate?.toISOString(),
      isArrivalManual: isManual
    }).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  cancelTrip(id: string, notes?: string): Observable<Trip> {
    return this.http.patch<TripBackendResponse>(`${this.apiUrl}/${id}/cancel`, { notes }).pipe(
      map(trip => this.mapTripFromBackend(trip))
    );
  }

  // Filtros de viajes
  getTripsByStatus(status: TripStatus): Observable<Trip[]> {
    return this.http.get<TripBackendResponse[]>(`${this.apiUrl}?status=${status}`).pipe(
      map(trips => trips.map(trip => this.mapTripFromBackend(trip)))
    );
  }

  getTripsByCustomer(customerId: string): Observable<Trip[]> {
    return this.http.get<TripBackendResponse[]>(`${this.apiUrl}?customerId=${customerId}`).pipe(
      map(trips => trips.map(trip => this.mapTripFromBackend(trip)))
    );
  }

  getTripsByDriver(driverId: string): Observable<Trip[]> {
    return this.http.get<TripBackendResponse[]>(`${this.apiUrl}?driverId=${driverId}`).pipe(
      map(trips => trips.map(trip => this.mapTripFromBackend(trip)))
    );
  }

  // Mappers
  private mapTripFromBackend(trip: TripBackendResponse): Trip {
    return {
      id: trip.id,
      customer: trip.customer,
      vehicle: trip.vehicle,
      driver: trip.driver,
      origin: trip.origin,
      destination: trip.destination,
      startKm: trip.startKm,
      endKm: trip.endKm,
      totalKm: trip.totalKm,
      departureDate: new Date(trip.departureDate),
      arrivalDate: trip.arrivalDate ? new Date(trip.arrivalDate) : null,
      isArrivalManual: trip.isArrivalManual,
      agreedPrice: trip.agreedPrice,
      totalExpenses: undefined,
      profit: undefined,
      status: this.mapStatusFromBackend(trip.status),
      notes: trip.notes,
      createdAt: new Date(trip.createdAt),
      updatedAt: new Date(trip.updatedAt)
    };
  }

  private mapTripToBackend(tripData: CreateTripDto | UpdateTripDto): any {
    const payload: any = {};

    if ('customerId' in tripData && tripData.customerId) {
      payload.customerId = tripData.customerId;
    }
    if ('vehicleId' in tripData && tripData.vehicleId) {
      payload.vehicleId = tripData.vehicleId;
    }
    if ('driverId' in tripData && tripData.driverId) {
      payload.driverId = tripData.driverId;
    }

    if ('origin' in tripData) payload.origin = tripData.origin;
    if ('destination' in tripData) payload.destination = tripData.destination;
    if ('startKm' in tripData) payload.startKm = tripData.startKm;
    if ('agreedPrice' in tripData) payload.agreedPrice = tripData.agreedPrice;
    if ('notes' in tripData) payload.notes = tripData.notes;

    if ('departureDate' in tripData) {
      payload.departureDate = tripData.departureDate instanceof Date
        ? tripData.departureDate.toISOString()
        : tripData.departureDate;
    }

    if ('status' in tripData && (tripData as UpdateTripDto).status !== undefined) {
      payload.status = this.mapStatusToBackend((tripData as UpdateTripDto).status!);
    }
    if ('endKm' in tripData && (tripData as UpdateTripDto).endKm !== undefined) {
      payload.endKm = (tripData as UpdateTripDto).endKm;
    }
    if ('arrivalDate' in tripData && (tripData as UpdateTripDto).arrivalDate !== undefined) {
      const arrivalDate = (tripData as UpdateTripDto).arrivalDate;
      payload.arrivalDate = arrivalDate instanceof Date
        ? arrivalDate.toISOString()
        : arrivalDate;
    }
    if ('isArrivalManual' in tripData && (tripData as UpdateTripDto).isArrivalManual !== undefined) {
      payload.isArrivalManual = (tripData as UpdateTripDto).isArrivalManual;
    }

    return payload;
  }

  private mapStatusFromBackend(status: string): TripStatus {
    const statusMap: { [key: string]: TripStatus } = {
      'PENDING': TripStatus.PENDING,
      'IN_PROGRESS': TripStatus.IN_PROGRESS,
      'COMPLETED': TripStatus.COMPLETED,
      'CANCELLED': TripStatus.CANCELLED
    };
    return statusMap[status] || TripStatus.PENDING;
  }

  private mapStatusToBackend(status: TripStatus): string {
    const statusMap: { [key in TripStatus]: string } = {
      [TripStatus.PENDING]: 'PENDING',
      [TripStatus.IN_PROGRESS]: 'IN_PROGRESS',
      [TripStatus.COMPLETED]: 'COMPLETED',
      [TripStatus.CANCELLED]: 'CANCELLED'
    };
    return statusMap[status];
  }
}
