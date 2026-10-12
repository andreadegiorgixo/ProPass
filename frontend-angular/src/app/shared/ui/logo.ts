import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo: quadrato pieno con una serratura ritagliata al centro, seguito dalla scritta.
 * La serratura è un vero ritaglio (fill-rule evenodd): mostra il colore di ciò che sta dietro.
 * Il colore è `currentColor`: viola di default, bianco con `inverse`.
 */
@Component({
  selector: 'pp-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.inverse]': 'inverse()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      color: var(--color-primary);
      font-size: var(--text-20);
      font-weight: var(--weight-logo);
      letter-spacing: var(--tracking-title);
      line-height: 1;
    }

    :host(.inverse) {
      color: var(--color-on-primary);
    }

    svg {
      display: block;
      flex: none;
    }
  `,
  template: `
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M0 8a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8zM11.5 15h9a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 9 22.5v-5A2.5 2.5 0 0 1 11.5 15zM11.75 15V12.5a4.25 4.25 0 0 1 8.5 0V15h-2.5v-2.5a1.75 1.75 0 0 0-3.5 0V15zM16 18a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 16 18z"
      />
    </svg>
    <span>ProPass</span>
  `,
})
export class Logo {
  readonly inverse = input(false);
}
