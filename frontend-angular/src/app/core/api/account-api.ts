import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE, silentUnauthorized } from './api.config';
import { AccountDto, AccountInput, AccountUpdate } from './models';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE}/account`;

  /** Registrazione. Il backend non apre la sessione: serve poi il login. */
  register(input: AccountInput): Observable<AccountDto> {
    return this.http.post<AccountDto>(this.url, input);
  }

  /** L'account della sessione. Un 401 qui è la risposta normale per chi non ha fatto l'accesso. */
  me(): Observable<AccountDto> {
    return this.http.get<AccountDto>(`${this.url}/me`, { context: silentUnauthorized() });
  }

  update(changes: AccountUpdate): Observable<AccountDto> {
    return this.http.put<AccountDto>(`${this.url}/me`, changes);
  }

  remove(): Observable<void> {
    return this.http.delete<void>(`${this.url}/me`);
  }
}
