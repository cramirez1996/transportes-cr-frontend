import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TripGroup, CreateTripGroupDto, UpdateTripGroupDto } from '../models/trip-group.model';

@Injectable({
  providedIn: 'root',
})
export class TripGroupService {
  private apiUrl = `${environment.apiUrl}/trip-groups`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TripGroup[]> {
    return this.http.get<TripGroup[]>(this.apiUrl);
  }

  getById(id: string): Observable<TripGroup> {
    return this.http.get<TripGroup>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateTripGroupDto): Observable<TripGroup> {
    return this.http.post<TripGroup>(this.apiUrl, data);
  }

  update(id: string, data: UpdateTripGroupDto): Observable<TripGroup> {
    return this.http.patch<TripGroup>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
