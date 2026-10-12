import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE, silentUnauthorized } from './api.config';
import { AccountDto, LoginInput } from './models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(input: LoginInput): Observable<AccountDto> {
    return this.http.post<AccountDto>(`${API_BASE}/auth/login`, input, {
      context: silentUnauthorized(),
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API_BASE}/auth/logout`, null, { context: silentUnauthorized() });
  }
}
