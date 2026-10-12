import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bottone con sola icona, 44×44. L'etichetta è obbligatoria: diventa nome accessibile e tooltip.
 * Uso: `<button ppIconButton type="button" label="Copia password"><pp-icon name="copy" /></button>`.
 */
@Component({
  selector: 'button[ppIconButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-label]': 'label()', '[attr.title]': 'label()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: var(--control-height);
      height: var(--control-height);
      padding: 0;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-control);
      color: var(--color-text);
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color var(--motion-fast);
    }

    @media (hover: hover) {
      :host(:hover:not(:disabled)) {
        background: var(--color-surface-muted);
      }
    }

    :host([aria-pressed='true']) {
      color: var(--color-primary);
    }
  `,
  template: `<ng-content />`,
})
export class IconButton {
  readonly label = input.required<string>();
}
