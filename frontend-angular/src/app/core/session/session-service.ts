import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, switchMap, tap, throwError } from 'rxjs';

import { AccountApi } from '../api/account-api';
import { errorStatus } from '../api/api-error';
import { AuthApi } from '../api/auth-api';
import { AccountDto, AccountInput, AccountUpdate, LoginInput } from '../api/models';

/** La registrazione è andata a buon fine, ma l'accesso automatico che la segue no. */
export class SignInAfterRegistrationError extends Error {
  constructor(readonly reason: unknown) {
    super("Account creato, ma l'accesso automatico non è riuscito.");
  }
}

/**
 * Stato della sessione. La sessione vera è il cookie HttpOnly gestito dal browser: qui si tiene
 * solo "chi sono" (l'AccountDto), in memoria, senza localStorage.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly accountApi = inject(AccountApi);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly current = signal<AccountDto | null>(null);

  readonly account = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);

  /** Avviso da mostrare nella pagina di accesso (sessione scaduta, account eliminato...). */
  readonly notice = signal<string | null>(null);

  /** true se all'avvio il server non ha risposto (diverso da "non sei loggato"). */
  readonly serverUnreachable = signal(false);

  /**
   * Chiamata all'avvio, prima delle rotte: 200 = sessione attiva, 401 = nessuna sessione.
   * Serve anche a ricevere il cookie XSRF-TOKEN. Non fallisce mai: l'app deve partire comunque.
   */
  async bootstrap(): Promise<void> {
    try {
      this.current.set(await firstValueFrom(this.accountApi.me()));
    } catch (error) {
      this.current.set(null);
      this.serverUnreachable.set(errorStatus(error) !== 401);
    }
  }

  login(input: LoginInput): Observable<AccountDto> {
    return this.authApi.login(input).pipe(tap((account) => this.signIn(account)));
  }

  /** Registra l'account e subito dopo apre la sessione con le stesse credenziali. */
  register(input: AccountInput): Observable<AccountDto> {
    return this.accountApi.register(input).pipe(
      switchMap(() =>
        this.authApi
          .login({ email: input.email, password: input.password })
          .pipe(catchError((error) => throwError(() => new SignInAfterRegistrationError(error)))),
      ),
      tap((account) => this.signIn(account)),
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      // Un 401 vuol dire che la sessione era già chiusa: l'obiettivo è comunque raggiunto.
      catchError((error) => (errorStatus(error) === 401 ? of(undefined) : throwError(() => error))),
      tap(() => this.current.set(null)),
    );
  }

  updateAccount(changes: AccountUpdate): Observable<AccountDto> {
    return this.accountApi.update(changes).pipe(tap((account) => this.current.set(account)));
  }

  deleteAccount(): Observable<void> {
    return this.accountApi.remove().pipe(tap(() => this.current.set(null)));
  }

  /** Chiamata dall'interceptor quando una richiesta riceve 401 con la sessione scaduta. */
  expire(): void {
    if (this.current() === null) {
      return;
    }
    this.current.set(null);
    this.notice.set('La sessione è scaduta. Accedi di nuovo.');
    void this.router.navigate(['/login']);
  }

  private signIn(account: AccountDto): void {
    this.notice.set(null);
    this.serverUnreachable.set(false);
    this.current.set(account);
  }
}
