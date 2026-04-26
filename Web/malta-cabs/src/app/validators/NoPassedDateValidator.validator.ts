import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Custom validator to ensure the selected date/time is not in the past.
 */
export function noPassedDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; //[Validators.required, this.noPassedDateValidator.bind(this)]ator handle empty values
  }

  const selectedDateTime = new Date(control.value);
  const now = new Date();

  // If the selected date/time is before now, it's invalid
  if (selectedDateTime < now) {
    return { passingDate: { value: control.value } };
  }

  return null;
}
