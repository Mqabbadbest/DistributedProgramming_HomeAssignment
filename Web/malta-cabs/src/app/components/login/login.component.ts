import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginDTO } from '../../dto/login.dto';
import { HeaderComponent } from '../../components/header/header.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isPasswordVisible = false;

  /**
   * This constructor initialises the LoginComponent with the Router, FormBuilder, and AuthService.
   * It also makes sure that the user is logged out by removing all items from local storage.
   * @param router
   * @param formBuilder
   * @param authService
   */
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('customerId');
  }

  /**
   * Initialises the login form with the email and password fields.
   * The email field is required and must be a valid email address.
   * The password field is required.
   */
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      password: ['', Validators.required],
    });
  }

  /**
   * Submits the login form to the api.
   * If the login is successful, the user is redirected to the dashboard.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) return;

    const payload: LoginDTO = this.loginForm.value;
    this.authService.login(payload).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        Swal.fire({
          title: 'Login successful!',
          text: `Welcome back!`,
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          background: '#1a1a1a',
          color: '#fff',
        });
        setTimeout(() => this.router.navigate(['/addBooking']), 2000);
      },
      error: (err) => {
        console.error('Failed to login:', err);
        Swal.fire({
          title: 'Login failed!',
          text: err.error?.error || 'Please check your credentials and try again.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#c5a050',
        });
      },
    });
  }

  /**
   * This method is used to determine whether the validation messages should be displayed for a specific form control.
   * The control must be touched or dirty and have errors.
   * @param controlName The form control name to check for validation messages.
   * @returns The boolean value indicating whether the validation messages should be displayed.
   */
  shouldProcessControlValidationMessages(controlName: string): boolean | undefined {
    const control = this.loginForm.get(controlName);
    return (control?.touched || control?.dirty) && !!control?.errors;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
