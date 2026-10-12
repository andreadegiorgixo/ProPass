import { HttpErrorResponse } from '@angular/common/http';

const GENERIC_MESSAGE = 'Qualcosa è andato storto. Riprova tra poco.';

export function errorStatus(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

/**
 * Messaggio leggibile per l'utente. Usa il `detail` del ProblemDetail del backend quando c'è,
 * altrimenti un testo per codice di stato. Non mostra mai l'errore grezzo.
 */
export function errorMessage(error: unknown, fallback: string = GENERIC_MESSAGE): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error as { detail?: unknown } | string | null;
  const detail = typeof body === 'object' && body !== null ? body.detail : undefined;
  if (typeof detail === 'string' && detail.trim() !== '') {
    return detail;
  }

  if (error.status === 0) {
    return 'Il server non risponde. Controlla la connessione e riprova.';
  }
  if (error.status === 403) {
    return 'Operazione non consentita. Ricarica la pagina e riprova.';
  }
  if (error.status >= 500) {
    return 'Il server ha avuto un problema. Riprova tra poco.';
  }
  return fallback;
}
