import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationDTO {
  id: string;
  customerId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface DiscountStatusDTO {
  isDiscountNotificationSent: boolean;
  isDiscountUsed: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiGatewayUrl}/customers`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<NotificationDTO[]>(`${this.base}/notifications`);
  }

  getDiscountStatus(): Observable<DiscountStatusDTO> {
    return this.http.get<DiscountStatusDTO>(`${this.base}/discount-status`);
  }

  markDiscountUsed(): Observable<any> {
    return this.http.post(`${this.base}/mark-discount-used`, {});
  }
}
