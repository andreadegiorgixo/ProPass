import { Injector, afterNextRender } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Campo obbligatorio che non accetta solo spazi. Restituisce l'errore standard `required`. */
export function requiredText(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim() !== '' ? null : { required: true };
}

/**
 * Validatore di gruppo: i campi `password` e `confirm` devono coincidere. La conferma si controlla
 * solo nel frontend: il server non vede mai il secondo campo.
 */
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

/**
 * Primo messaggio da mostrare per un controllo, scelto tra quelli dati per chiave d'errore.
 * Compare solo dopo che l'utente ha toccato il campo o ha provato a inviare il modulo.
 */
export function visibleError(
  control: AbstractControl | null,
  messages: Record<string, string>,
): string | null {
  if (!control || !control.touched || !control.errors) {
    return null;
  }
  const key = Object.keys(control.errors).find((candidate) => candidate in messages);
  return key ? (messages[key] ?? null) : null;
}

/** Dopo un invio non valido sposta il focus sul primo campo con errore. */
export function focusFirstInvalid(root: HTMLElement, injector: Injector): void {
  afterNextRender(
    () => root.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    { injector },
  );
}

export const MIN_PASSWORD_LENGTH = 8;
