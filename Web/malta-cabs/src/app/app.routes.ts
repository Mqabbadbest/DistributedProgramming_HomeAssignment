import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AddBookingComponent } from './components/add-booking/add-booking.component';
import { authGuard } from './guards/auth.guard';
import { PaymentComponent } from './components/payment/payment.component';
import { paymentGuard } from './guards/payment.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'addBooking', component: AddBookingComponent, canActivate: [authGuard] },
  {
    path: 'payment/:paymentId',
    component: PaymentComponent,
    canActivate: [authGuard, paymentGuard],
  },
];
