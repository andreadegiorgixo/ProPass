import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Logo } from '../../shared/ui/logo';

/**
 * Pagina di accesso e registrazione: banda viola con il simbolo del logo disegnato in grande
 * e tagliato dal bordo, modulo allineato a sinistra accanto alla banda.
 * Su schermi stretti la banda diventa una striscia in alto.
 */
@Component({
  selector: 'pp-auth-layout',
  imports: [RouterOutlet, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .brand {
      position: relative;
      overflow: hidden;
      height: 9rem;
      padding: var(--space-6) var(--gutter);
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    /* Il simbolo è un tono più scuro del viola: piatto, senza ombre né sfumature. */
    .mark {
      position: absolute;
      right: -3rem;
      bottom: -3rem;
      width: 10rem;
      height: 10rem;
      color: var(--color-primary-hover);
    }

    main {
      display: flex;
      justify-content: flex-start;
      padding: var(--space-8) var(--gutter) var(--space-12);
      outline: none;
    }

    .panel {
      width: 100%;
      max-width: 25rem;
    }

    @media (min-width: 56rem) {
      :host {
        grid-template-columns: 38fr 62fr;
        grid-template-rows: none;
      }

      .brand {
        height: auto;
        padding: var(--space-12);
      }

      .mark {
        right: -30%;
        bottom: -12%;
        width: 120%;
        height: auto;
        aspect-ratio: 1;
      }

      main {
        align-items: center;
        padding: var(--space-12) var(--space-12) var(--space-12) 6rem;
      }
    }
  `,
  template: `
    <header class="brand">
      <pp-logo [inverse]="true" />
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M0 8a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8zM11.5 15h9a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 9 22.5v-5A2.5 2.5 0 0 1 11.5 15zM11.75 15V12.5a4.25 4.25 0 0 1 8.5 0V15h-2.5v-2.5a1.75 1.75 0 0 0-3.5 0V15zM16 18a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 16 18z"
        />
      </svg>
    </header>
    <main id="main" tabindex="-1">
      <div class="panel">
        <router-outlet />
      </div>
    </main>
  `,
})
export class AuthLayout {}
