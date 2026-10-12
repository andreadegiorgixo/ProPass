import { HttpClient, HttpContext } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ACCOUNT } from '../../testing/fixtures';
import { SILENT_UNAUTHORIZED } from '../api/api.config';
import { SessionService } from '../session/session-service';
import { provideApiHttp } from './http.providers';

const COOKIE = 'XSRF-TOKEN';
const TOKEN = 'token-di-prova';

describe('provideApiHttp', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    document.cookie = `${COOKIE}=${TOKEN}; path=/`;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideApiHttp(), provideHttpClientTesting()],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => {
    document.cookie = `${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    http.verify();
  });

  describe('protezione CSRF', () => {
    it.each(['POST', 'PUT', 'DELETE'] as const)(
      '%s verso /api/... porta X-XSRF-TOKEN con il valore del cookie',
      (method) => {
        client.request(method, '/api/password/1', { body: {} }).subscribe();

        const request = http.expectOne('/api/password/1');
        expect(request.request.headers.get('X-XSRF-TOKEN')).toBe(TOKEN);
        request.flush({});
      },
    );

    it('le GET non portano il token', () => {
      client.get('/api/password').subscribe();

      const request = http.expectOne('/api/password');
      expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
      request.flush([]);
    });

    it('un URL assoluto verso un altro sito non riceve il token', () => {
      client.post('https://altro-sito.example/api', {}).subscribe();

      const request = http.expectOne('https://altro-sito.example/api');
      expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
      request.flush({});
    });
  });

  describe('sessione scaduta', () => {
    async function signIn(): Promise<void> {
      const boot = session.bootstrap();
      http.expectOne('/api/account/me').flush(ACCOUNT);
      await boot;
    }

    it('un 401 su una richiesta normale chiude la sessione e porta all\'accesso', async () => {
      await signIn();
      expect(session.isAuthenticated()).toBe(true);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      client.get('/api/password').subscribe({ error: () => undefined });
      http.expectOne('/api/password').flush('', { status: 401, statusText: 'Unauthorized' });

      expect(session.isAuthenticated()).toBe(false);
      expect(session.notice()).toBe('La sessione è scaduta. Accedi di nuovo.');
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('un 401 atteso (accesso con credenziali errate) non la chiude', async () => {
      await signIn();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const context = new HttpContext().set(SILENT_UNAUTHORIZED, true);

      client.post('/api/auth/login', {}, { context }).subscribe({ error: () => undefined });
      http.expectOne('/api/auth/login').flush('', { status: 401, statusText: 'Unauthorized' });

      expect(session.isAuthenticated()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('gli altri errori non toccano la sessione', async () => {
      await signIn();

      client.get('/api/password').subscribe({ error: () => undefined });
      http.expectOne('/api/password').flush('', { status: 500, statusText: 'Server Error' });

      expect(session.isAuthenticated()).toBe(true);
      expect(session.notice()).toBeNull();
    });
  });
});
