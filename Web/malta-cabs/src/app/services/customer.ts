import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private base = `${environment.apiGatewayUrl}/customers`;

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/register`, payload);
  }

  login(payload: LoginPayload): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/login`, payload);
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${id}`);
  }
}