import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterDTO } from '../dto/register.dto';
import { LoginDTO } from '../dto/login.dto';
import { CustomerDTO } from '../dto/customer.dto';
import { Router } from '@angular/router';
import { LoginResponseDTO } from '../dto/loginResponse.dto';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiGatewayUrl}/customers`;
  private _isAuthenticated: boolean = false;

  public get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }
  public set isAuthenticated(value: boolean) {
    this._isAuthenticated = value;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    let localStorageIsAuthenticated = localStorage.getItem('isAuthenticated');
    this.isAuthenticated = localStorageIsAuthenticated === 'true';
  }

  register(payload: RegisterDTO): Observable<CustomerDTO> {
    return this.http.post<CustomerDTO>(`${this.base}/register`, payload);
  }

  login(payload: LoginDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.base}/login`, payload).pipe(
      tap({
        next: (response: LoginResponseDTO) => {
          this.setAuthResponse(response);
        },
        error: (err) => {
          console.error('Failed to login:', err);
          Swal.fire({
            title: 'Login failed!',
            text: 'Please check your credentials and try again.',
            icon: 'error',
          });
        },
      }),
    );
  }

  private setAuthResponse(loginResponse: LoginResponseDTO) {
    this.isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('sessionToken', loginResponse.token);
    localStorage.setItem('customerId', loginResponse.customerId);
  }

  private getSessionToken(): string | null {
    return localStorage.getItem('sessionToken');
  }

  private getCustomerId(): string | null {
    return localStorage.getItem('customerId');
  }

  public logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('customerId');
    this.router.navigate(['/login']);
  }

  public canAccessRoute(): boolean {
    // Check if session token actually exists in localStorage
    const hasSessionToken = !!this.getSessionToken();
    // Keep in-memory state in sync with localStorage
    this.isAuthenticated = hasSessionToken;
    return hasSessionToken;
  }
}
