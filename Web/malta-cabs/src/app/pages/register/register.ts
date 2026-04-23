import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, HeaderComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';

  onSubmit() {
    console.log('Register:', this.email);
  }
}