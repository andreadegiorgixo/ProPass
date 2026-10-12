import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { VaultService } from '../../features/vault/vault-service';
import { Topbar } from './topbar';

/**
 * Cornice delle pagine con sessione. Il VaultService vive qui, non nella radice: quando la
 * sessione finisce e la cornice viene distrutta, le password in memoria spariscono con lei.
 */
@Component({
  selector: 'pp-app-shell',
  imports: [RouterOutlet, Topbar],
  providers: [VaultService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    main {
      max-width: var(--content-max);
      margin: 0 auto;
      padding: var(--space-8) var(--gutter) var(--space-16);
      outline: none;
    }
  `,
  template: `
    <pp-topbar />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
  `,
})
export class AppShell {
  constructor() {
    // Le finestre vivono in un overlay fuori dalla pagina: se la cornice sparisce (uscita,
    // sessione scaduta, account eliminato) non devono restare aperte sopra l'accesso.
    const dialog = inject(Dialog);
    inject(DestroyRef).onDestroy(() => dialog.closeAll());
  }
}
