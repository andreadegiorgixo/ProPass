import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Logo } from '../../shared/ui/logo';

/** Pagina a due colonne di accesso e registrazione: blocco viola a sinistra, modulo a destra. */
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
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6) var(--gutter);
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .tagline {
      max-width: 16ch;
      font-size: var(--text-20);
      font-weight: var(--weight-title);
      letter-spacing: var(--tracking-title);
      line-height: 1.2;
      text-wrap: balance;
    }

    main {
      display: flex;
      justify-content: center;
      padding: var(--space-8) var(--gutter) var(--space-12);
      outline: none;
    }

    .panel {
      width: 100%;
      max-width: 25rem;
    }

    @media (min-width: 56rem) {
      :host {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: none;
      }

      .brand {
        justify-content: space-between;
        padding: var(--space-12);
      }

      .tagline {
        font-size: var(--text-40);
        line-height: 1.1;
      }

      main {
        align-items: center;
        padding: var(--space-12);
      }
    }
  `,
  template: `
    <header class="brand">
      <pp-logo [inverse]="true" />
      <p class="tagline">Le tue password, in un posto solo.</p>
    </header>
    <main id="main" tabindex="-1">
      <div class="panel">
        <router-outlet />
      </div>
    </main>
  `,
})
export class AuthLayout {}
