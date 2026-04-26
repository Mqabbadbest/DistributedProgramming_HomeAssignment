import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { firstValueFrom } from 'rxjs';

export const paymentGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const paymentService = inject(PaymentService);
  const router = inject(Router);

  const paymentId = route.paramMap.get('paymentId');

  if (!paymentId) {
    router.navigate(['/']);
    return false;
  }

  try {
    const payment = await firstValueFrom(paymentService.getById(paymentId));

    if (payment.status !== 'pending') {
      router.navigate(['/']);
      return false;
    }

    return true;
  } catch {
    router.navigate(['/']);
    return false;
  }
};
