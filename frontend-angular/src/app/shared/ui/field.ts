import { ChangeDetectionStrategy, Component, Directive, computed, inject, input } from '@angular/core';

import { Icon } from './icon';

let nextFieldId = 0;

/**
 * Campo di un modulo: etichetta sempre visibile, controllo proiettato, aiuto o errore sotto.
 * Il controllo è un `<input ppInput>` (o `<pp-password-input>`): prende da qui id, aria-invalid
 * e aria-describedby, così etichetta ed errore sono collegati senza codice nelle pagine.
 */
@Component({
  selector: 'pp-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .label {
      font-size: var(--text-14);
      font-weight: var(--weight-medium);
    }

    .optional {
      color: var(--color-text-muted);
      font-weight: var(--weight-regular);
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      font-size: var(--text-14);
      color: var(--color-text-muted);
    }

    .message--error {
      color: var(--color-danger);
    }

    .message pp-icon {
      margin-top: 0.125rem;
    }
  `,
  template: `
    <label class="label" [attr.for]="controlId">
      {{ label() }}@if (optional()) {
        <span class="optional"> (facoltativo)</span>
      }
    </label>
    <ng-content />
    @if (error(); as message) {
      <p class="message message--error" role="alert" [id]="errorId">
        <pp-icon name="alert" [size]="16" />
        <span>{{ message }}</span>
      </p>
    } @else if (hint(); as text) {
      <p class="message" [id]="hintId">{{ text }}</p>
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input('');
  readonly optional = input(false);

  readonly controlId = `pp-field-${nextFieldId++}`;
  protected readonly errorId = `${this.controlId}-error`;
  protected readonly hintId = `${this.controlId}-hint`;

  /** Valore di aria-describedby per il controllo: l'errore se c'è, altrimenti l'aiuto. */
  readonly describedBy = computed(() => {
    if (this.error()) {
      return this.errorId;
    }
    return this.hint() ? this.hintId : null;
  });
}

/** Stile e collegamento al `pp-field` per `<input>` e `<textarea>`. */
@Directive({
  selector: 'input[ppInput], textarea[ppInput]',
  host: {
    class: 'pp-input',
    '[attr.id]': 'field?.controlId ?? null',
    '[attr.aria-invalid]': 'field?.error() ? "true" : null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class InputDirective {
  protected readonly field = inject(Field, { optional: true });
}
