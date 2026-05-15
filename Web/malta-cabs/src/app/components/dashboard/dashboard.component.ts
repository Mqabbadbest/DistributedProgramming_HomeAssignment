import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, HeaderComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  bookings: any[] = [];
  payments: Map<string, any> = new Map();
  isLoading = true;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;

    Promise.all([
      firstValueFrom(this.bookingService.getCurrentBookings()),
      firstValueFrom(this.bookingService.getPastBookings()),
    ])
      .then(async ([current, past]) => {
        const all = [...(current || []), ...(past || [])];
        this.bookings = all.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const paymentPromises = this.bookings
          .filter((b) => b.paymentId)
          .map((b) =>
            firstValueFrom(this.paymentService.getById(b.paymentId))
              .then((payment) => this.payments.set(b.paymentId, payment))
              .catch(() => {}),
          );

        await Promise.all(paymentPromises);

        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('Dashboard', 'Failed to load bookings', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  openBooking(id: string): void {
    this.router.navigate(['/booking-detail', id]);
  }

  isPaymentSuccessful(booking: any): boolean {
    if (!booking.paymentId) return false;
    const payment = this.payments.get(booking.paymentId);
    return payment?.status === 'completed';
  }

  isPaymentFailed(booking: any): boolean {
    if (!booking.paymentId) return false;
    const payment = this.payments.get(booking.paymentId);
    return payment?.status === 'failed';
  }
}
