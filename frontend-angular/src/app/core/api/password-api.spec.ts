import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { makePassword } from '../../testing/fixtures';
import { PasswordDto, PasswordInput } from './models';
import { PasswordApi } from './password-api';

const INPUT: PasswordInput = {
  nomePassword: 'GitHub',
  password: 's3cr3t',
  link: 'https://github.com',
  username: 'mario',
  note: null,
};

describe('PasswordApi', () => {
  let api: PasswordApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PasswordApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list: GET /api/password', () => {
    let result: PasswordDto[] | undefined;
    api.list().subscribe((list) => (result = list));

    const request = http.expectOne('/api/password');
    expect(request.request.method).toBe('GET');
    request.flush([makePassword(1, 'GitHub')]);

    expect(result?.map((item) => item.nomePassword)).toEqual(['GitHub']);
  });

  it('create: POST /api/password con i soli campi del modulo', () => {
    api.create(INPUT).subscribe();

    const request = http.expectOne('/api/password');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(INPUT);
    request.flush(makePassword(1, 'GitHub'));
  });

  it('update: PUT /api/password/{id}', () => {
    api.update(7, INPUT).subscribe();

    const request = http.expectOne('/api/password/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(INPUT);
    request.flush(makePassword(7, 'GitHub'));
  });

  it('remove: DELETE /api/password/{id}', () => {
    let completed = false;
    api.remove(7).subscribe({ complete: () => (completed = true) });

    const request = http.expectOne('/api/password/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(completed).toBe(true);
  });

  describe('ricerche', () => {
    it.each([
      ['searchByNome', '/api/password/nomePassword', 'nomePassword'],
      ['searchByUsername', '/api/password/username', 'username'],
      ['searchByLink', '/api/password/linkPassword', 'link'],
    ] as const)('%s: GET %s?%s=...', (method, url, param) => {
      api[method]('git').subscribe();

      const request = http.expectOne((candidate) => candidate.url === url);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get(param)).toBe('git');
      request.flush([]);
    });

    it('codifica nell\'URL i caratteri che spezzerebbero la query (& e spazi)', () => {
      api.searchByLink('https://x.it/a?b=1&c=2 d').subscribe();

      const request = http.expectOne((candidate) => candidate.url === '/api/password/linkPassword');
      expect(request.request.params.get('link')).toBe('https://x.it/a?b=1&c=2 d');
      expect(request.request.urlWithParams).toContain('%26c=2');
      expect(request.request.urlWithParams).not.toContain('&c=2');
      expect(request.request.urlWithParams).toContain('%20d');
      request.flush([]);
    });

    it('un 404 vuol dire "nessun risultato": lista vuota, non errore', () => {
      let result: PasswordDto[] | undefined;
      let failed = false;
      api.searchByNome('zzz').subscribe({
        next: (list) => (result = list),
        error: () => (failed = true),
      });

      http
        .expectOne((candidate) => candidate.url === '/api/password/nomePassword')
        .flush({ detail: 'Password non trovata' }, { status: 404, statusText: 'Not Found' });

      expect(failed).toBe(false);
      expect(result).toEqual([]);
    });

    it('gli altri errori restano errori', () => {
      let status: number | undefined;
      api.searchByUsername('x').subscribe({ error: (error) => (status = error.status) });

      http
        .expectOne((candidate) => candidate.url === '/api/password/username')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
    });
  });

  it('list: un 404 NON viene nascosto (solo le ricerche lo trattano come vuoto)', () => {
    let status: number | undefined;
    api.list().subscribe({ error: (error) => (status = error.status) });

    http.expectOne('/api/password').flush('', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});
