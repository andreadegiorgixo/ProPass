import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import { API_BASE } from './api.config';
import { PasswordDto, PasswordInput } from './models';

@Injectable({ providedIn: 'root' })
export class PasswordApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE}/password`;

  /** Tutte le password dell'account, ordinate per nome. Vault vuoto = lista vuota. */
  list(): Observable<PasswordDto[]> {
    return this.http.get<PasswordDto[]>(this.url);
  }

  create(input: PasswordInput): Observable<PasswordDto> {
    return this.http.post<PasswordDto>(this.url, input);
  }

  update(id: number, input: PasswordInput): Observable<PasswordDto> {
    return this.http.put<PasswordDto>(`${this.url}/${id}`, input);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // Le tre ricerche del backend cercano il testo "contenuto", senza distinguere maiuscole e
  // minuscole. Un 404 vuol dire "nessun risultato": qui diventa una lista vuota.

  searchByNome(term: string): Observable<PasswordDto[]> {
    return this.search('nomePassword', 'nomePassword', term);
  }

  searchByUsername(term: string): Observable<PasswordDto[]> {
    return this.search('username', 'username', term);
  }

  searchByLink(term: string): Observable<PasswordDto[]> {
    return this.search('linkPassword', 'link', term);
  }

  private search(path: string, param: string, term: string): Observable<PasswordDto[]> {
    return this.http
      .get<PasswordDto[]>(`${this.url}/${path}`, { params: { [param]: term } })
      .pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 404
            ? of([])
            : throwError(() => error),
        ),
      );
  }
}
