import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ACCOUNT } from '../../testing/fixtures';
import { AccountApi } from './account-api';
import { SILENT_UNAUTHORIZED } from './api.config';
import { AuthApi } from './auth-api';

describe('AccountApi', () => {
  let api: AccountApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AccountApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('register: POST /api/account', () => {
    const input = { username: 'mario', email: 'mario@example.com', password: 'una-password-1' };
    api.register(input).subscribe();

    const request = http.expectOne('/api/account');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush(ACCOUNT);
  });

  it('me: GET /api/account/me, con il 401 segnato come atteso', () => {
    api.me().subscribe();

    const request = http.expectOne('/api/account/me');
    expect(request.request.method).toBe('GET');
    expect(request.request.context.get(SILENT_UNAUTHORIZED)).toBe(true);
    request.flush(ACCOUNT);
  });

  it('update: PUT /api/account/me con solo i campi passati', () => {
    api.update({ username: 'nuovo' }).subscribe();

    const request = http.expectOne('/api/account/me');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ username: 'nuovo' });
    expect(request.request.context.get(SILENT_UNAUTHORIZED)).toBe(false);
    request.flush(ACCOUNT);
  });

  it('remove: DELETE /api/account/me', () => {
    api.remove().subscribe();

    const request = http.expectOne('/api/account/me');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});

describe('AuthApi', () => {
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login: POST /api/auth/login con email e password', () => {
    api.login({ email: 'mario@example.com', password: 'una-password-1' }).subscribe();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'mario@example.com', password: 'una-password-1' });
    expect(request.request.context.get(SILENT_UNAUTHORIZED)).toBe(true);
    request.flush(ACCOUNT);
  });

  it('logout: POST /api/auth/logout', () => {
    api.logout().subscribe();

    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });
});
