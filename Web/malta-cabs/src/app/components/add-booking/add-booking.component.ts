import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BookingService } from '../../services/booking.service';
import { PaymentService, type PriceCalculationResponse } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import Swal from 'sweetalert2';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-add-booking',
  imports: [ReactiveFormsModule, HeaderComponent, CommonModule],
  templateUrl: './add-booking.component.html',
  styleUrl: './add-booking.component.css',
})
export class AddBookingComponent implements OnInit, OnDestroy {
  bookingForm!: FormGroup;

  originQuery = '';
  destinationQuery = '';
  originResults: NominatimResult[] = [];
  destinationResults: NominatimResult[] = [];
  originSelected: { lat: number; lng: number } | null = null;
  destinationSelected: { lat: number; lng: number } | null = null;

  // Price calculation properties
  calculatedPrice: number | null = null;
  tripDetails: Partial<PriceCalculationResponse> | null = null;
  isCalculatingPrice = false;
  priceCalculationError: string | null = null;

  private debounceTimer: any;
  private priceCalculationSubject = new Subject<void>();
  private priceCalculationSubscription: Subscription | null = null;

  readonly cabTypes = ['Economic', 'Premium', 'Executive'];

  constructor(
    private formBuilder: FormBuilder,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef, // add this
  ) {}

  ngOnInit(): void {
    console.log('[AddBooking] Component initialized');
    console.log('[AddBooking] Customer ID from localStorage:', localStorage.getItem('customerId'));

    this.bookingForm = this.formBuilder.group({
      dateTime: ['', Validators.required],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
      cabType: ['', Validators.required],
    });

    // Set up price recalculation with debouncing - ONLY for passengers, dateTime, cabType
    this.priceCalculationSubscription = this.priceCalculationSubject
      .pipe(debounceTime(500))
      .subscribe(() => this.calculatePrice());

    // Trigger price calculation only when passengers, dateTime, or cabType change (NOT on search input)
    this.bookingForm.valueChanges.subscribe((values) => {
      console.log('[AddBooking] Form values changed (passengers/dateTime/cabType):', values);
      this.priceCalculationSubject.next();
    });
  }

  ngOnDestroy(): void {
    this.priceCalculationSubscription?.unsubscribe();
  }

  /**
   * Searches for locations using Nominatim API with a debounce.
   * @param query The search query string.
   * @param type Whether searching for origin or destination.
   */
  searchLocation(query: string, type: 'origin' | 'destination') {
    console.log(`[AddBooking] Searching ${type} location:`, query);
    clearTimeout(this.debounceTimer);
    if (query.length < 3) {
      console.log(`[AddBooking] Query too short (${query.length} chars), clearing results`);
      type === 'origin' ? (this.originResults = []) : (this.destinationResults = []);
      return;
    }
    this.debounceTimer = setTimeout(async () => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=it&format=json&limit=5`;
      console.log(`[AddBooking] Fetching from Nominatim:`, url);
      try {
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data: NominatimResult[] = await res.json();
        console.log(`[AddBooking] Nominatim results for ${type}:`, data);
        type === 'origin' ? (this.originResults = data) : (this.destinationResults = data);
      } catch (error) {
        console.error(`[AddBooking] Error fetching ${type} locations:`, error);
      }
    }, 400);
  }

  /**
   * Selects an origin location from the dropdown results.
   * @param result The selected Nominatim result.
   */
  selectOrigin(result: NominatimResult) {
    this.originSelected = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    this.originQuery = result.display_name;
    this.originResults = [];
    this.cdr.detectChanges(); // update input value and clear dropdown
    this.priceCalculationSubject.next();
  }

  selectDestination(result: NominatimResult) {
    this.destinationSelected = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    this.destinationQuery = result.display_name;
    this.destinationResults = [];
    this.cdr.detectChanges(); // update input value and clear dropdown
    this.priceCalculationSubject.next();
  }

  /**
   * Calculates the price based on current form values.
   * Only calculates if form is valid and locations are selected.
   */
  private calculatePrice(): void {
    console.log('[AddBooking] calculatePrice() called');

    this.priceCalculationError = null;

    if (this.bookingForm.invalid || !this.originSelected || !this.destinationSelected) {
      this.calculatedPrice = null;
      this.tripDetails = null;
      this.cdr.detectChanges(); // force update even on reset
      return;
    }

    const requestPayload = {
      customerId: localStorage.getItem('customerId') || '',
      cabType: this.bookingForm.value.cabType,
      dateTime: this.bookingForm.value.dateTime,
      passengers: this.bookingForm.value.passengers,
      startLocation: this.originSelected,
      endLocation: this.destinationSelected,
    };

    console.log('[AddBooking] Sending price calculation request:', requestPayload);
    this.isCalculatingPrice = true;
    this.cdr.detectChanges(); // show spinner immediately

    this.paymentService.calculatePrice(requestPayload).subscribe({
      next: (response) => {
        console.log('[AddBooking] ✓ Price calculation response:', response);
        this.calculatedPrice = response.price;
        this.tripDetails = response;
        this.isCalculatingPrice = false;
        this.priceCalculationError = null;
        this.cdr.detectChanges(); // force UI update
      },
      error: (err) => {
        console.error('[AddBooking] ✗ Price calculation error:', err);
        this.isCalculatingPrice = false;
        this.calculatedPrice = null;
        this.tripDetails = null;
        this.priceCalculationError =
          err.error?.error || 'Failed to calculate price. Please try again.';
        this.cdr.detectChanges(); // force UI update on error too
        Swal.fire({
          title: 'Price calculation failed',
          text: this.priceCalculationError || 'Could not calculate price. Please try again.',
          icon: 'warning',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#c5a050',
        });
      },
    });
  }

  // /**
  //  * Resets price calculation when locations change.
  //  */
  // private resetPrice(): void {
  //   console.log('[AddBooking] Resetting price calculation');
  //   this.calculatedPrice = null;
  //   this.tripDetails = null;
  //   this.priceCalculationError = null;
  // }

  /**
   * Uses the browser's geolocation API to set the user's current location as origin.
   */
  useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          );
          const data = await res.json();
          this.originSelected = { lat, lng };
          this.originQuery = data.display_name;
          this.cdr.detectChanges(); // update input immediately
          this.priceCalculationSubject.next();
        } catch (error) {
          console.error('[AddBooking] Error reverse geocoding:', error);
        }
      },
      (error) => {
        console.error('[AddBooking] Geolocation error:', error);
        Swal.fire({
          title: 'Location unavailable',
          text: 'Could not get your current location.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#c5a050',
        });
      },
    );
  }

  /**
   * Determines whether validation messages should be shown for a control.
   * @param controlName The form control name.
   * @returns Boolean indicating whether to show validation messages.
   */
  shouldProcessControlValidationMessages(controlName: string): boolean | undefined {
    const control = this.bookingForm.get(controlName);
    return (control?.touched || control?.dirty) && !!control?.errors;
  }

  /**
   * Submits the booking form to the API.
   * If successful, the user is redirected to the dashboard.
   */
  onSubmit(): void {
    console.log('[AddBooking] onSubmit() called');
    console.log('[AddBooking] Form valid?', this.bookingForm.valid);

    if (this.bookingForm.invalid) {
      console.log('[AddBooking] Form is invalid, aborting submission');
      return;
    }

    if (!this.originSelected) {
      console.log('[AddBooking] Origin not selected');
      Swal.fire({
        title: 'Missing pickup',
        text: 'Please select a pickup location from the dropdown.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#c5a050',
      });
      return;
    }

    if (!this.destinationSelected) {
      console.log('[AddBooking] Destination not selected');
      Swal.fire({
        title: 'Missing destination',
        text: 'Please select a destination from the dropdown.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#c5a050',
      });
      return;
    }

    if (!this.calculatedPrice) {
      console.log('[AddBooking] No price calculated');
      Swal.fire({
        title: 'No price calculated',
        text: 'Please wait for the price to be calculated before submitting.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#c5a050',
      });
      return;
    }

    const payload = {
      startLocation: this.originSelected,
      endLocation: this.destinationSelected,
      dateTime: this.bookingForm.value.dateTime,
      passengers: this.bookingForm.value.passengers,
      cabType: this.bookingForm.value.cabType,
      price: this.calculatedPrice,
      cabFareCents: this.tripDetails?.cabFareCents,
      durationMinutes: this.tripDetails?.durationMinutes,
      distanceKilometers: this.tripDetails?.distanceKilometers,
    };

    console.log('[AddBooking] Submitting booking to Booking MS with payload:', payload);

    this.bookingService.createBooking(payload).subscribe({
      next: (response) => {
        console.log('[AddBooking] ✓ Booking created successfully:', response);
        console.log('[AddBooking] ✓ Payment created with ID:', response.paymentId);
        console.log('[AddBooking] Complete booking response:', {
          bookingId: response.id,
          paymentId: response.paymentId,
          price: response.price,
          status: response.status,
        });
        Swal.fire({
          title: 'Booking confirmed!',
          text: 'Your cab has been booked successfully.',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          background: '#1a1a1a',
          color: '#fff',
        });
        setTimeout(() => {
          console.log('[AddBooking] Redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('[AddBooking] ✗ Booking creation failed:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
          fullError: err,
        });
        Swal.fire({
          title: 'Booking failed!',
          text: err.error?.error || 'Something went wrong. Please try again.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#c5a050',
        });
      },
    });
  }
}
