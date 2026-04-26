import { AbstractControl, ValidationErrors } from '@angular/forms';
import { luhnCheck } from '../utils/luhn';

export const luhnValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  return luhnCheck(control.value.replace(/\s/g, '')) ? null : { luhn: 'Invalid card number' };
};

export const futureDateValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const [month, year] = control.value.split('/').map((v: string) => parseInt(v.trim(), 10));
  if (!month || !year) return { expiry: 'Invalid format' };

  const now = new Date();
  const expiry = new Date(2000 + year, month - 1, 1);
  const current = new Date(now.getFullYear(), now.getMonth(), 1);

  return expiry >= current ? null : { expiry: 'Card has expired' };
};
