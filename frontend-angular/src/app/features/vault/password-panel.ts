import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, filter, finalize } from 'rxjs';

import { errorMessage } from '../../core/api/api-error';
import { PasswordDto, PasswordInput } from '../../core/api/models';
import { focusFirstInvalid, requiredText, visibleError } from '../../shared/forms/form-helpers';
import { Button } from '../../shared/ui/button';
import { ConfirmService } from '../../shared/ui/confirm';
import { Field, InputDirective } from '../../shared/ui/field';
import { Icon } from '../../shared/ui/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { Notice } from '../../shared/ui/notice';
import { PasswordInput as PasswordInputField } from '../../shared/ui/password-input';

export interface PasswordPanelData {
  mode: 'create' | 'edit';
  /** Presente solo in modifica. */
  password?: PasswordDto;
  /** Il salvataggio vero lo fornisce la pagina: il pannello non conosce il servizio del vault. */
  save: (input: PasswordInput) => Observable<unknown>;
}

export type PasswordPanelResult = 'saved';

const MESSAGES = {
  nomePassword: { required: 'Inserisci il nome.' },
  link: { required: 'Inserisci il link.' },
  username: { required: 'Inserisci lo username.' },
  password: { required: 'Inserisci la password.' },
} as const;

type RequiredField = keyof typeof MESSAGES;

/** Pannello laterale per creare o modificare una password. */
@Component({
  selector: 'pp-password-panel',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    Button,
    IconButton,
    Icon,
    Field,
    InputDirective,
    PasswordInputField,
    Notice,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './password-panel.css',
  template: `
    <header class="head">
      <h2 id="pp-panel-title" class="title">
        {{ data.mode === 'edit' ? 'Modifica password' : 'Nuova password' }}
      </h2>
      <button ppIconButton type="button" label="Chiudi" (click)="requestClose()">
        <pp-icon name="x" />
      </button>
    </header>

    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate autocomplete="off">
      <div class="body">
        <pp-field label="Nome" [error]="error('nomePassword')">
          <input ppInput type="text" formControlName="nomePassword" autocomplete="off" data-autofocus />
        </pp-field>

        <pp-field label="Link" [error]="error('link')">
          <input
            ppInput
            type="text"
            inputmode="url"
            formControlName="link"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </pp-field>

        <pp-field label="Username" [error]="error('username')">
          <input
            ppInput
            type="text"
            formControlName="username"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </pp-field>

        <pp-field label="Password" [error]="error('password')">
          <pp-password-input formControlName="password" autocomplete="new-password" />
        </pp-field>

        <pp-field label="Note" [optional]="true">
          <textarea ppInput rows="4" formControlName="note"></textarea>
        </pp-field>

        @if (data.password; as saved) {
          <p class="meta">Creata il {{ saved.creazionePassword | date: 'd MMM y' }}</p>
        }

        @if (formError(); as message) {
          <pp-notice tone="error">{{ message }}</pp-notice>
        }
      </div>

      <footer class="foot">
        <button ppButton type="submit" [loading]="saving()" [disabled]="saving()">
          Salva password
        </button>
        <button
          ppButton
          type="button"
          variant="secondary"
          [disabled]="saving()"
          (click)="requestClose()"
        >
          Annulla
        </button>
      </footer>
    </form>
  `,
})
export class PasswordPanel {
  protected readonly data = inject<PasswordPanelData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<PasswordPanelResult>>(DialogRef);
  private readonly confirmService = inject(ConfirmService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nomePassword: ['', requiredText],
    link: ['', requiredText],
    username: ['', requiredText],
    password: ['', Validators.required],
    note: [''],
  });

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  constructor() {
    const saved = this.data.password;
    if (saved) {
      this.form.setValue({
        nomePassword: saved.nomePassword,
        link: saved.link,
        username: saved.username,
        password: saved.password,
        note: saved.note ?? '',
      });
    }

    // Esc e clic sullo sfondo non chiudono da soli: se ci sono modifiche si chiede conferma.
    this.ref.keydownEvents
      .pipe(
        filter((event) => event.key === 'Escape'),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        event.preventDefault();
        void this.requestClose();
      });

    this.ref.backdropClick.pipe(takeUntilDestroyed()).subscribe(() => void this.requestClose());
  }

  protected error(name: RequiredField): string | null {
    return visibleError(this.form.controls[name], MESSAGES[name]);
  }

  protected async requestClose(): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (this.form.dirty) {
      const discard = await this.confirmService.confirm({
        title: 'Scartare le modifiche?',
        message: 'Le modifiche a questa password non sono state salvate.',
        confirmLabel: 'Scarta',
        cancelLabel: 'Continua a modificare',
        destructive: true,
      });
      if (!discard) {
        return;
      }
    }

    this.ref.close();
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    const value = this.form.getRawValue();
    const input: PasswordInput = {
      nomePassword: value.nomePassword.trim(),
      link: value.link.trim(),
      username: value.username.trim(),
      // La password non si tocca: gli spazi possono farne parte.
      password: value.password,
      note: value.note.trim() === '' ? null : value.note,
    };

    this.saving.set(true);
    this.formError.set(null);

    this.data
      .save(input)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.ref.close('saved');
        },
        error: (error: unknown) =>
          this.formError.set(
            errorMessage(error, 'Non è stato possibile salvare la password. Riprova.'),
          ),
      });
  }
}
