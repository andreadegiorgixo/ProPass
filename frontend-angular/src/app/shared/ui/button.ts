import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline' | 'ghost';

/**
 * Bottone testuale. Si usa sugli elementi nativi: `<button ppButton variant="secondary">`.
 * Per i bottoni con sola icona c'è `ppIconButton`.
 */
@Component({
  selector: 'button[ppButton], a[ppButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[class.is-loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-height: var(--control-height);
      padding: 0 var(--space-5);
      border: 1px solid transparent;
      border-radius: var(--radius-control);
      font-size: var(--text-16);
      font-weight: var(--weight-medium);
      line-height: 1.2;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color var(--motion-fast),
        border-color var(--motion-fast),
        color var(--motion-fast);
    }

    :host([data-variant='primary']) {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    :host([data-variant='secondary']) {
      background: var(--color-bg);
      border-color: var(--color-text);
      color: var(--color-text);
    }

    :host([data-variant='danger']) {
      background: var(--color-danger);
      color: var(--color-on-danger);
    }

    :host([data-variant='danger-outline']) {
      background: var(--color-bg);
      border-color: var(--color-danger);
      color: var(--color-danger);
    }

    :host([data-variant='ghost']) {
      padding: 0 var(--space-3);
      background: transparent;
      color: var(--color-primary);
    }

    /* Hover solo dove esiste un puntatore: sul touch resterebbe "appiccicato" dopo il tocco. */
    @media (hover: hover) {
      :host([data-variant='primary']:hover:not(:disabled)) {
        background: var(--color-primary-hover);
        color: var(--color-on-primary);
      }
      :host([data-variant='secondary']:hover:not(:disabled)) {
        background: var(--color-surface-muted);
        color: var(--color-text);
      }
      :host([data-variant='danger']:hover:not(:disabled)) {
        background: var(--color-danger-hover);
        color: var(--color-on-danger);
      }
      :host([data-variant='danger-outline']:hover:not(:disabled)) {
        background: var(--color-surface-muted);
        color: var(--color-danger);
      }
      :host([data-variant='ghost']:hover:not(:disabled)) {
        background: var(--color-surface-muted);
        color: var(--color-primary-hover);
      }
    }

    :host(:disabled:not(.is-loading)) {
      background: var(--color-surface-muted);
      border-color: var(--color-border);
      color: var(--color-text-muted);
    }

    :host(.is-loading) {
      cursor: progress;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  template: `
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly loading = input(false);
}
