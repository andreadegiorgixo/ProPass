import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

import { ToastHost } from './shared/ui/toast';

@Component({
  selector: 'pp-root',
  imports: [RouterOutlet, ToastHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  constructor() {
    // Dopo ogni cambio pagina (non al primo caricamento) il focus passa al contenuto principale:
    // chi usa tastiera o screen reader non resta fermo sul link che ha appena premuto.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() =>
        // Lo scorrimento (in cima, o dov'ero tornando indietro) lo gestisce il router: qui il
        // focus passa al contenuto senza spostare la pagina, altrimenti la barra sparirebbe.
        afterNextRender(() => this.focusMain({ scroll: false }), { injector: this.injector }),
      );
  }

  protected skipToContent(event: Event): void {
    // Il link "#main" con <base href="/"> porterebbe alla radice del sito: gestito a mano.
    event.preventDefault();
    this.focusMain({ scroll: true });
  }

  private focusMain({ scroll }: { scroll: boolean }): void {
    this.document.getElementById('main')?.focus({ preventScroll: !scroll });
  }
}
