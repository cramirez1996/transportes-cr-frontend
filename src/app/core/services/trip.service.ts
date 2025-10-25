import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Trip, CreateTripDto, UpdateTripDto, TripStatus, TripFilters } from '../models/trip.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';
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
  isSubcontracted?: boolean;
  subcontractor?: any;
  subcontractorCost?: number | null;
  commissionAmount?: number | null;
  status: string;
  notes?: string;
  tags?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trips`;

  // CRUD de Viajes con paginación
  getTrips(pagination: PaginationParams = { page: 1, limit: 10 }, filters?: TripFilters): Observable<PaginatedResponse<Trip>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      // Basic filters
      if (filters.status) params = params.set('status', filters.status);
      if (filters.isSubcontracted !== undefined) params = params.set('isSubcontracted', filters.isSubcontracted.toString());
      if (filters.customerId) params = params.set('customerId', filters.customerId);
      if (filters.driverId) params = params.set('driverId', filters.driverId);
      if (filters.vehicleId) params = params.set('vehicleId', filters.vehicleId);
      if (filters.subcontractorId) params = params.set('subcontractorId', filters.subcontractorId);
      
      // Date filters
      if (filters.startDate) {
        const dateStr = filters.startDate instanceof Date
          ? filters.startDate.toISOString()
          : new Date(filters.startDate).toISOString();
        params = params.set('startDate', dateStr);
      }
      if (filters.endDate) {
        const dateStr = filters.endDate instanceof Date
          ? filters.endDate.toISOString()
          : new Date(filters.endDate).toISOString();
        params = params.set('endDate', dateStr);
      }

      // Location filters
      if (filters.origin) params = params.set('origin', filters.origin);
      if (filters.destination) params = params.set('destination', filters.destination);

      // Price filters
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        params = params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        params = params.set('maxPrice', filters.maxPrice.toString());
      }

      // Quick search
      if (filters.search) params = params.set('search', filters.search);

      // Sorting
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PaginatedResponse<any>>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data.map(trip => this.mapTripFromBackend(trip)),
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages
      }))
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
      isSubcontracted: trip.isSubcontracted || false,
      subcontractor: trip.subcontractor,
      subcontractorCost: trip.subcontractorCost,
      commissionAmount: trip.commissionAmount,
      status: this.mapStatusFromBackend(trip.status),
      notes: trip.notes,
      createdAt: new Date(trip.createdAt),
      updatedAt: new Date(trip.updatedAt),
      tags: trip.tags
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

    if ('tags' in tripData) {
      payload.tags = tripData.tags;
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
