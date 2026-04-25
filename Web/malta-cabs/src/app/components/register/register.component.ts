import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterDTO } from '../../dto/register.dto';
import { HeaderComponent } from '../../components/header/header.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isPasswordVisible = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+39|0039)?\s?\d{9,11}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const payload: RegisterDTO = this.registerForm.value;
    this.authService.register(payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'Account created!',
          text: 'You can now log in to Italy Cabs.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          background: '#1a1a1a',
          color: '#fff',
        });
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        Swal.fire({
          title: 'Registration failed!',
          text: err.error?.error || 'Something went wrong. Please try again.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#c5a050',
        });
      },
    });
  }

  shouldProcessControlValidationMessages(controlName: string): boolean | undefined {
    const control = this.registerForm.get(controlName);
    return (control?.touched || control?.dirty) && !!control?.errors;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
