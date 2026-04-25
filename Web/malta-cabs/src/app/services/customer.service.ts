import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerDTO } from '../dto/customer.dto';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private base = `${environment.apiGatewayUrl}/customers`;

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<CustomerDTO> {
    return this.http.get<CustomerDTO>(`${this.base}/${id}`);
  }
}
