import { Clipboard } from '@angular/cdk/clipboard';
import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { errorMessage } from '../../core/api/api-error';
import { PasswordDto } from '../../core/api/models';
import { Button } from '../../shared/ui/button';
import { ConfirmService } from '../../shared/ui/confirm';
import { Icon } from '../../shared/ui/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { ToastService } from '../../shared/ui/toast';
import { PasswordPanel, PasswordPanelData, PasswordPanelResult } from './password-panel';
import { PasswordRow } from './password-row';
import { SearchFilter, VaultService } from './vault-service';

@Component({
  selector: 'pp-vault-page',
  imports: [Button, IconButton, Icon, PasswordRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vault-page.html',
  styleUrl: './vault-page.css',
  host: { '(document:keydown)': 'onDocumentKeydown($event)' },
})
export class VaultPage {
  protected readonly vault = inject(VaultService);
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly confirmService = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly clipboard = inject(Clipboard);
  private readonly document = inject(DOCUMENT);

  protected readonly filters: readonly { value: SearchFilter; label: string }[] = [
    { value: 'tutto', label: 'Tutto' },
    { value: 'nome', label: 'Nome' },
    { value: 'username', label: 'Username' },
    { value: 'link', label: 'Link' },
  ];

  /** Righe segnaposto durante il primo caricamento. */
  protected readonly placeholders = [0, 1, 2, 3, 4, 5];

  /** Id della password aperta nel pannello di modifica: la sua riga risulta selezionata. */
  protected readonly editingId = signal<number | null>(null);

  private readonly searchField = viewChild.required<ElementRef<HTMLInputElement>>('search');
  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');

  // ---------------------------------------------------------------- ricerca

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const typing =
      target !== null &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const modalOpen = this.document.querySelector('.cdk-dialog-container') !== null;
    if (typing || modalOpen) {
      return;
    }

    event.preventDefault();
    this.searchField().nativeElement.focus();
  }

  protected onSearchEscape(event: Event): void {
    if (this.vault.query() !== '') {
      event.preventDefault();
      this.vault.clearQuery();
    }
  }

  protected clearSearch(): void {
    this.vault.clearQuery();
    this.searchField().nativeElement.focus();
  }

  // ---------------------------------------------------------------- azioni sulle righe

  protected openCreate(): void {
    this.openPanel({ mode: 'create', save: (input) => this.vault.create(input) });
  }

  protected openEdit(item: PasswordDto): void {
    this.editingId.set(item.id);
    this.openPanel({
      mode: 'edit',
      password: item,
      save: (input) => this.vault.update(item.id, input),
    });
  }

  protected copy(item: PasswordDto): void {
    if (this.clipboard.copy(item.password)) {
      this.toast.success('Password copiata');
    } else {
      this.toast.error('Non è stato possibile copiare la password.');
    }
  }

  protected async remove(item: PasswordDto): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: `Eliminare la password di ${item.nomePassword}?`,
      message: "L'operazione non si può annullare.",
      confirmLabel: 'Elimina',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.vault.remove(item.id).subscribe({
      next: () => {
        this.toast.success('Password eliminata');
        // La riga non c'è più: il focus riparte dal titolo, non dal nulla.
        this.title().nativeElement.focus();
      },
      error: (error: unknown) =>
        this.toast.error(errorMessage(error, 'Non è stato possibile eliminare la password.')),
    });
  }

  // ---------------------------------------------------------------- interno

  private openPanel(data: PasswordPanelData): void {
    const ref = this.dialog.open<PasswordPanelResult, PasswordPanelData, PasswordPanel>(
      PasswordPanel,
      {
        data,
        role: 'dialog',
        ariaModal: true,
        ariaLabelledBy: 'pp-panel-title',
        panelClass: 'pp-side-panel',
        backdropClass: 'pp-backdrop',
        width: 'min(28rem, 100vw)',
        height: '100%',
        maxWidth: '100vw',
        positionStrategy: this.overlay.position().global().right('0').top('0'),
        // Esc e clic sullo sfondo li gestisce il pannello: con modifiche in corso chiede conferma.
        disableClose: true,
        autoFocus: '[data-autofocus]',
        restoreFocus: true,
      },
    );

    ref.closed.subscribe((result) => {
      this.editingId.set(null);
      if (result === 'saved') {
        this.toast.success('Password salvata');
      }
    });
  }
}
