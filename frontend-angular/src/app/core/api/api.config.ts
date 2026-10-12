import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Prefisso comune di tutte le chiamate al backend. Sono URL relativi di proposito: il dev server
 * li inoltra a Spring Boot togliendo "/api" (vedi proxy.conf.json), così cookie di sessione e
 * cookie CSRF restano della stessa origine e Angular aggiunge da solo l'header X-XSRF-TOKEN.
 */
export const API_BASE = '/api';

/** Se true, un 401 su questa richiesta è atteso e non fa scattare il "sessione scaduta". */
export const SILENT_UNAUTHORIZED = new HttpContextToken<boolean>(() => false);

export function silentUnauthorized(): HttpContext {
  return new HttpContext().set(SILENT_UNAUTHORIZED, true);
}
