import { HttpErrorResponse } from '@angular/common/http';

import { errorMessage, errorStatus } from './api-error';

const http = (status: number, body: unknown = null) =>
  new HttpErrorResponse({ status, error: body, statusText: 'x' });

describe('errorMessage', () => {
  it('usa il "detail" del ProblemDetail quando c\'è', () => {
    const error = http(409, { detail: 'Email mario@example.com già in uso', status: 409 });

    expect(errorMessage(error)).toBe('Email mario@example.com già in uso');
  });

  it('ignora un "detail" vuoto o non testuale', () => {
    expect(errorMessage(http(500, { detail: '   ' }))).toBe(
      'Il server ha avuto un problema. Riprova tra poco.',
    );
    expect(errorMessage(http(400, { detail: 42 }), 'Riprova.')).toBe('Riprova.');
  });

  it('server irraggiungibile (status 0)', () => {
    expect(errorMessage(http(0))).toBe('Il server non risponde. Controlla la connessione e riprova.');
  });

  it('403: invita a ricaricare (token CSRF mancante)', () => {
    expect(errorMessage(http(403))).toBe('Operazione non consentita. Ricarica la pagina e riprova.');
  });

  it('5xx: messaggio generico, mai il corpo grezzo', () => {
    const message = errorMessage(http(500, '<html>Internal Server Error</html>'));

    expect(message).toBe('Il server ha avuto un problema. Riprova tra poco.');
    expect(message).not.toContain('<html>');
  });

  it('usa il testo di riserva per gli altri codici e per errori non HTTP', () => {
    expect(errorMessage(http(418), 'Non riuscito.')).toBe('Non riuscito.');
    expect(errorMessage(new Error('boom'), 'Non riuscito.')).toBe('Non riuscito.');
    expect(errorMessage(undefined)).toBe('Qualcosa è andato storto. Riprova tra poco.');
  });
});

describe('errorStatus', () => {
  it('restituisce lo status solo per gli errori HTTP', () => {
    expect(errorStatus(http(401))).toBe(401);
    expect(errorStatus(new Error('x'))).toBeNull();
  });
});
