import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentDTO } from '../dto/payment.dto';

export interface CalculatePriceRequest {
  customerId: string;
  cabType: string;
  dateTime: string;
  passengers: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
}

export interface PriceCalculationResponse {
  price: number;
  durationMinutes: number;
  distanceKilometers: number;
  cabFareCents: number;
  paymentId?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiGatewayUrl}/payments`;

  constructor(private http: HttpClient) {}

  calculatePrice(data: CalculatePriceRequest): Observable<PriceCalculationResponse> {
    return this.http.post<PriceCalculationResponse>(`${this.base}/calculate`, data);
  }

  getById(paymentId: string): Observable<PaymentDTO> {
    return this.http.get<PaymentDTO>(`${this.base}/${paymentId}`);
  }

  pay(
    paymentId: string,
    payload: {
      cardHolderName: string;
      cardNumber: string;
      cvv: string;
      cardExpiry: string;
    },
  ): Observable<any> {
    return this.http.post(`${this.base}/${paymentId}/pay`, payload);
  }
}
