import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { HeaderComponent } from '../../components/header/header.component';
import { luhnValidator, futureDateValidator } from '../../validators/card.validators';
import Swal from 'sweetalert2';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-payment',
  imports: [ReactiveFormsModule, HeaderComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  paymentId: string = '';
  price: number = 0;
  isSubmitting = false;
  isLoading = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
  ) {}

  /**
   * Initialises the payment form and retrieves the paymentId from the route.
   */
  ngOnInit(): void {
    this.paymentId = this.route.snapshot.paramMap.get('paymentId') || '';

    if (!this.paymentId) {
      console.error('Payment', 'No paymentId in route');
      this.router.navigate(['/']);
      return;
    }

    // Verify payment is still pending before showing form
    this.paymentService.getById(this.paymentId).subscribe({
      next: (payment) => {
        if (payment.status !== 'pending') {
          Swal.fire({
            title: 'Payment unavailable',
            text: `This payment is already ${payment.status}.`,
            icon: 'warning',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#c5a050',
          }).then(() => this.router.navigate(['/']));
          return;
        }
        this.price = payment.price;
        this.isLoading = false;
        this.cdr.detectChanges(); // force UI to update
      },
      error: (err) => {
        console.error('Payment', 'Failed to load payment', err);
        this.router.navigate(['/']);
      },
    });

    this.paymentForm = this.formBuilder.group({
      cardHolderName: ['', [Validators.required, Validators.minLength(3)]],
      cardNumber: ['', [Validators.required, luhnValidator]],
      cardExpiry: ['', [Validators.required, futureDateValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    });
  }

  /**
   * Formats the card number with spaces every 4 digits as user types.
   */
  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '').replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    this.paymentForm.patchValue({ cardNumber: value }, { emitEvent: false });
    event.target.value = value;
  }

  /**
   * Formats the expiry date as MM/YY as user types.
   */
  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
    this.paymentForm.patchValue({ cardExpiry: value }, { emitEvent: false });
    event.target.value = value;
  }

  /**
   * Determines whether validation messages should be shown for a control.
   */
  shouldProcessControlValidationMessages(controlName: string): boolean | undefined {
    const control = this.paymentForm.get(controlName);
    return (control?.touched || control?.dirty) && !!control?.errors;
  }

  /**
   * Returns the first validation error message for a control.
   */
  getErrorMessage(controlName: string): string {
    const control = this.paymentForm.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) return `${controlName} is required`;
    if (control.errors['luhn']) return 'Invalid card number';
    if (control.errors['expiry']) return control.errors['expiry'];
    if (control.errors['pattern']) return 'CVV must be 3 digits';
    if (control.errors['minlength']) return 'Name must be at least 3 characters';

    return 'Invalid value';
  }

  /**
   * Submits the payment form to the Payment MS.
   */
  onSubmit(): void {
    if (this.paymentForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    console.log('[Payment] Submitting payment for paymentId:', this.paymentId);

    const { cardHolderName, cardNumber, cardExpiry, cvv } = this.paymentForm.value;

    this.paymentService
      .pay(this.paymentId, {
        cardHolderName,
        cardNumber: cardNumber.replace(/\s/g, ''), // strip spaces before sending
        cardExpiry,
        cvv,
      })
      .subscribe({
        next: (response) => {
          console.log('[Payment] ✓ Payment successful:', response);
          console.log('[Payment] Response discountApplied:', response.discountApplied);

          if (response.discountApplied) {
            console.log('[Payment] Calling markDiscountUsed()...');
            this.notificationService.markDiscountUsed().subscribe({
              next: (result) => {
                console.log('[Payment] ✓ Discount marked as used:', result);
              },
              error: (err) => {
                console.error('[Payment] ✗ Failed to mark discount used:', err);
              },
            });
          } else {
            console.log('[Payment] Discount was NOT applied, skipping markDiscountUsed()');
          }

          this.isSubmitting = false;
          Swal.fire({
            title: 'Payment successful!',
            text: 'Your booking has been confirmed and paid.',
            icon: 'success',
            showConfirmButton: false,
            timer: 2500,
            background: '#1a1a1a',
            color: '#fff',
          });
          setTimeout(() => this.router.navigate(['/dashboard']), 2500);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('[Payment] ✗ Payment failed:', err);

          const isDeclined = err.status === 402;
          Swal.fire({
            title: isDeclined ? 'Payment declined' : 'Payment failed!',
            text: err.error?.error || 'Something went wrong. Please try again.',
            icon: 'error',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#c5a050',
          }).then(() => this.router.navigate(['/dashboard']));
        },
      });
  }
}
