import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from './icon';

/** Messaggio a livello di modulo o di pagina: errore (rosso) o informazione (neutra). */
@Component({
  selector: 'pp-notice',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'tone() === "error" ? "alert" : "status"',
    '[attr.data-tone]': 'tone()',
  },
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg);
      border: 1px solid var(--color-border-control);
      border-radius: var(--radius-control);
      font-size: var(--text-14);
    }

    :host([data-tone='error']) {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }

    :host([data-tone='info']) pp-icon {
      color: var(--color-primary);
    }

    pp-icon {
      margin-top: 0.0625rem;
    }
  `,
  template: `
    <pp-icon [name]="tone() === 'error' ? 'alert' : 'info'" />
    <div><ng-content /></div>
  `,
})
export class Notice {
  readonly tone = input<'error' | 'info'>('info');
}
