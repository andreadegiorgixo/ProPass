import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';

import { sessionExpiredInterceptor } from './session-expired.interceptor';

/**
 * HttpClient configurato per il backend di ProPass.
 *
 * Il backend scrive il cookie XSRF-TOKEN e pretende l'header X-XSRF-TOKEN su POST, PUT e DELETE
 * (tranne registrazione e login). Angular lo aggiunge da solo, ma solo per URL relativi: per
 * questo tutte le chiamate usano "/api/...".
 */
export function provideApiHttp() {
  return provideHttpClient(
    withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    withInterceptors([sessionExpiredInterceptor]),
  );
}
