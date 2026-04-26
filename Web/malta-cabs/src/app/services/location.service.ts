import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private base = `${environment.apiGatewayUrl}/locations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  add(payload: { name: string; lat: number; lng: number }): Observable<any> {
    return this.http.post(this.base, payload);
  }

  update(id: string, payload: { name?: string; lat?: number; lng?: number }): Observable<any> {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }

  getWeather(id: string): Observable<any> {
    return this.http.get(`${this.base}/${id}/weather`);
  }
}
