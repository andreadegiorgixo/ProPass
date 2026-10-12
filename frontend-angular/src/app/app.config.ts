import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideApiHttp } from './core/http/http.providers';
import { PageTitleStrategy } from './core/layout/page-title-strategy';
import { SessionService } from './core/session/session-service';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Ogni pagina nuova parte dall'alto; tornando indietro si riprende dov'ero.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideApiHttp(),
    { provide: LOCALE_ID, useValue: 'it' },
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    // Prima delle rotte: scopre se c'è già una sessione (e riceve il cookie XSRF-TOKEN).
    provideAppInitializer(() => inject(SessionService).bootstrap()),
  ],
};
