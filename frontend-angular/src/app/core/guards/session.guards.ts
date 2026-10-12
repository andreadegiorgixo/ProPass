import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../session/session-service';

/** Vault e account: solo con sessione attiva, altrimenti accesso. */
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  return session.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

/** Accesso e registrazione: solo senza sessione, altrimenti vault. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/vault']) : true;
};
