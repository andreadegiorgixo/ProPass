import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ACCOUNT } from '../../testing/fixtures';
import { SessionService, SignInAfterRegistrationError } from './session-service';

const CREDENTIALS = { username: 'mario.rossi', email: ACCOUNT.email, password: 'una-password-1' };

describe('SessionService', () => {
  let session: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('bootstrap', () => {
    it('200: la sessione è attiva', async () => {
      const done = session.bootstrap();
      http.expectOne('/api/account/me').flush(ACCOUNT);
      await done;

      expect(session.isAuthenticated()).toBe(true);
      expect(session.account()?.username).toBe('mario.rossi');
      expect(session.serverUnreachable()).toBe(false);
    });

    it('401: nessuna sessione, server raggiungibile', async () => {
      const done = session.bootstrap();
      http.expectOne('/api/account/me').flush('', { status: 401, statusText: 'Unauthorized' });
      await done;

      expect(session.isAuthenticated()).toBe(false);
      expect(session.serverUnreachable()).toBe(false);
    });

    it('server spento: l\'app parte comunque e lo segnala', async () => {
      const done = session.bootstrap();
      http.expectOne('/api/account/me').error(new ProgressEvent('error'), { status: 0 });
      await done;

      expect(session.isAuthenticated()).toBe(false);
      expect(session.serverUnreachable()).toBe(true);
    });
  });

  describe('register', () => {
    it('crea l\'account e poi accede con le stesse credenziali', async () => {
      const result = firstValueFrom(session.register(CREDENTIALS));

      const registration = http.expectOne('/api/account');
      expect(registration.request.method).toBe('POST');
      expect(registration.request.body).toEqual(CREDENTIALS);
      registration.flush(ACCOUNT);

      const login = http.expectOne('/api/auth/login');
      expect(login.request.body).toEqual({ email: CREDENTIALS.email, password: CREDENTIALS.password });
      login.flush(ACCOUNT);

      expect((await result).id).toBe(ACCOUNT.id);
      expect(session.isAuthenticated()).toBe(true);
    });

    it('se l\'accesso successivo fallisce lo distingue dall\'errore di registrazione', async () => {
      const result = firstValueFrom(session.register(CREDENTIALS));
      http.expectOne('/api/account').flush(ACCOUNT);
      http.expectOne('/api/auth/login').flush('', { status: 500, statusText: 'Server Error' });

      await expect(result).rejects.toBeInstanceOf(SignInAfterRegistrationError);
      expect(session.isAuthenticated()).toBe(false);
    });

    it('un 409 sulla registrazione resta un errore HTTP, non viene tentato l\'accesso', async () => {
      const result = firstValueFrom(session.register(CREDENTIALS));
      http
        .expectOne('/api/account')
        .flush({ detail: 'Email già in uso' }, { status: 409, statusText: 'Conflict' });

      const error = await result.catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(409);
      http.expectNone('/api/auth/login');
    });
  });

  describe('login e logout', () => {
    it('login: imposta l\'account e azzera l\'avviso', async () => {
      session.notice.set('La sessione è scaduta. Accedi di nuovo.');

      const result = firstValueFrom(session.login({ email: ACCOUNT.email, password: 'x' }));
      http.expectOne('/api/auth/login').flush(ACCOUNT);
      await result;

      expect(session.isAuthenticated()).toBe(true);
      expect(session.notice()).toBeNull();
    });

    it('logout: svuota l\'account', async () => {
      const boot = session.bootstrap();
      http.expectOne('/api/account/me').flush(ACCOUNT);
      await boot;

      const result = firstValueFrom(session.logout(), { defaultValue: undefined });
      http.expectOne('/api/auth/logout').flush(null);
      await result;

      expect(session.isAuthenticated()).toBe(false);
    });

    it('logout con 401: la sessione era già chiusa, è un successo', async () => {
      const result = firstValueFrom(session.logout(), { defaultValue: undefined });
      http.expectOne('/api/auth/logout').flush('', { status: 401, statusText: 'Unauthorized' });

      await expect(result).resolves.toBeUndefined();
    });

    it('logout con altri errori: l\'errore arriva a chi chiama e la sessione resta', async () => {
      const boot = session.bootstrap();
      http.expectOne('/api/account/me').flush(ACCOUNT);
      await boot;

      const result = firstValueFrom(session.logout(), { defaultValue: undefined });
      http.expectOne('/api/auth/logout').flush('', { status: 500, statusText: 'Server Error' });

      await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
      expect(session.isAuthenticated()).toBe(true);
    });
  });

  describe('expire', () => {
    it('senza sessione non fa nulla (nessun avviso a vuoto)', () => {
      session.expire();

      expect(session.notice()).toBeNull();
    });
  });
});
