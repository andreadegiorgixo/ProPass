import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { InputDirective } from './field';
import { Icon } from './icon';

/**
 * Campo password con "mostra/nascondi", compatibile con i Reactive Forms (`formControlName`).
 * Va dentro un `<pp-field>`: l'input interno ne eredita id ed errori.
 */
@Component({
  selector: 'pp-password-input',
  imports: [InputDirective, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInput), multi: true },
  ],
  styles: `
    :host {
      display: block;
    }

    .wrap {
      position: relative;
    }

    .control {
      padding-right: var(--control-height);
    }

    /* Geist Mono distingue bene 0/O e l/1: solo per i caratteri visibili della password. */
    .control--shown {
      font-family: var(--font-mono);
      font-size: var(--text-14);
    }

    .toggle {
      position: absolute;
      top: 0;
      right: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--control-height);
      height: var(--control-height);
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: var(--radius-control);
      color: var(--color-text);
      touch-action: manipulation;
    }

    @media (hover: hover) {
      .toggle:hover {
        background: var(--color-surface-muted);
      }
    }

    .toggle[aria-pressed='true'] {
      color: var(--color-primary);
    }
  `,
  template: `
    <div class="wrap">
      <input
        ppInput
        class="control"
        [class.control--shown]="visible()"
        [type]="visible() ? 'text' : 'password'"
        [value]="value()"
        [disabled]="disabled()"
        [attr.autocomplete]="autocomplete()"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="toggle"
        [attr.aria-label]="visible() ? 'Nascondi password' : 'Mostra password'"
        [attr.aria-pressed]="visible()"
        (click)="visible.set(!visible())"
      >
        <pp-icon [name]="visible() ? 'eye-off' : 'eye'" />
      </button>
    </div>
  `,
})
export class PasswordInput implements ControlValueAccessor {
  /** "current-password" per l'accesso, "new-password" quando si sceglie una password nuova. */
  readonly autocomplete = input('current-password');

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly visible = signal(false);

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }
}
