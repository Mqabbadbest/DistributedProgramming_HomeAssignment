import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiGatewayUrl}/bookings`;

  constructor(private http: HttpClient) {}

  createBooking(payload: any): Observable<any> {
    return this.http.post(this.base, payload);
  }

  getCurrentBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/current`);
  }

  getPastBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/past`);
  }

  getBookingById(bookingId: string): Observable<any> {
    return this.http.get(`${this.base}/${bookingId}`);
  }
}
