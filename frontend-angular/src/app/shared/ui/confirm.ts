import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Button } from './button';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Azione distruttiva: il bottone di conferma diventa rosso. */
  destructive?: boolean;
  /** Elemento a cui restituire il focus alla chiusura (default: quello attivo prima). */
  restoreFocusTo?: HTMLElement | null;
}

/** Finestra di conferma modale. `confirm()` risolve true solo se l'utente conferma. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmOptions, ConfirmDialog>(ConfirmDialog, {
      data: options,
      role: 'alertdialog',
      ariaModal: true,
      ariaLabelledBy: 'pp-confirm-title',
      ariaDescribedBy: options.message ? 'pp-confirm-message' : null,
      panelClass: 'pp-dialog',
      backdropClass: 'pp-backdrop',
      width: '26rem',
      maxWidth: 'calc(100vw - 2rem)',
      // Il focus parte su "Annulla": una conferma distruttiva non deve scattare con un Invio distratto.
      autoFocus: '[data-autofocus]',
      restoreFocus: options.restoreFocusTo ?? true,
    });
    return (await firstValueFrom(ref.closed, { defaultValue: false })) === true;
  }
}

@Component({
  selector: 'pp-confirm-dialog',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: var(--space-6);
    }

    .title {
      font-size: var(--text-20);
    }

    .message {
      margin-top: var(--space-2);
      color: var(--color-text-muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
    }
  `,
  template: `
    <h2 id="pp-confirm-title" class="title">{{ data.title }}</h2>
    @if (data.message) {
      <p id="pp-confirm-message" class="message">{{ data.message }}</p>
    }
    <div class="actions">
      <button ppButton variant="secondary" type="button" data-autofocus (click)="ref.close(false)">
        {{ data.cancelLabel ?? 'Annulla' }}
      </button>
      <button
        ppButton
        type="button"
        [variant]="data.destructive ? 'danger' : 'primary'"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel }}
      </button>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
