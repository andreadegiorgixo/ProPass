import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { SILENT_UNAUTHORIZED } from '../api/api.config';
import { SessionService } from '../session/session-service';

/**
 * Un 401 su una richiesta "normale" significa sessione scaduta: svuota lo stato e porta
 * all'accesso. Login, logout e controllo iniziale lo segnalano con SILENT_UNAUTHORIZED.
 */
export const sessionExpiredInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.context.get(SILENT_UNAUTHORIZED)
      ) {
        session.expire();
      }
      return throwError(() => error);
    }),
  );
};
