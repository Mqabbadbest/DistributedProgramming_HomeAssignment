import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';
import { LocationService } from '../../services/location.service';
import { HeaderComponent } from '../../components/header/header.component';
import { DatePipe, CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-booking-detail',
  imports: [HeaderComponent, RouterLink, DatePipe, CommonModule],
  templateUrl: './booking-detail.component.html',
  styleUrl: './booking-detail.component.css',
})
export class BookingDetailComponent implements OnInit {
  booking: any = null;
  payment: any = null;
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private locationService: LocationService,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('BookingDetail Init - ID:', id);
    if (!id) {
      console.log('BookingDetail - No ID found, navigating back');
      this.router.navigate(['/dashboard']);
      return;
    }

    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.customerService.getById(customerId).subscribe({
        next: (customer) => {
          this.customerName = customer.firstName + ' ' + customer.lastName;
          this.customerEmail = customer.email;
          this.customerPhone = customer.phone;
          console.log('BookingDetail - Customer loaded:', this.customerName);
        },
        error: (err) => {
          console.error('BookingDetail - Failed to load customer:', err);
          this.customerName = '';
          this.customerEmail = '';
          this.customerPhone = '';
          this.cdr.detectChanges();
        },
      });
    }

    this.bookingService.getBookingById(id).subscribe({
      next: (booking) => {
        this.booking = booking;
        console.log('BookingDetail - Booking loaded:', booking);

        if (booking.paymentId) {
          console.log('BookingDetail - Loading payment:', booking.paymentId);
          this.paymentService.getById(booking.paymentId).subscribe({
            next: (payment) => {
              this.payment = payment;
              console.log('BookingDetail - Payment loaded:', payment);
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('BookingDetail - Failed to load payment:', err);
              this.isLoading = false;
              this.cdr.detectChanges();
            },
          });
        } else {
          console.log('BookingDetail - No payment ID, marking as loaded');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('BookingDetail - Failed to load booking:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  savePickupLocation(): void {
    Swal.fire({
      title: 'Save pickup location',
      input: 'text',
      inputLabel: 'Give this location a name',
      inputPlaceholder: 'e.g. Home, Office...',
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonColor: '#c5a050',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'Please enter a name';
        return null;
      },
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.locationService
        .add({
          name: result.value,
          lat: this.booking.startLocation.lat,
          lng: this.booking.startLocation.lng,
        })
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Location saved!',
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
              background: '#1a1a1a',
              color: '#fff',
            });
          },
          error: (err) => {
            Swal.fire({
              title: 'Failed to save',
              text: err.error?.error || 'Something went wrong',
              icon: 'error',
              background: '#1a1a1a',
              color: '#fff',
              confirmButtonColor: '#c5a050',
            });
          },
        });
    });
  }

  isPaymentSuccessful(): boolean {
    return this.payment?.status === 'completed';
  }

  isPaymentFailed(): boolean {
    return this.payment?.status === 'failed';
  }
}
