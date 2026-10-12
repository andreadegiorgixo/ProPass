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
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { errorMessage, errorStatus } from '../../core/api/api-error';
import { SessionService, SignInAfterRegistrationError } from '../../core/session/session-service';
import {
  MIN_PASSWORD_LENGTH,
  focusFirstInvalid,
  passwordsMatch,
  requiredText,
  visibleError,
} from '../../shared/forms/form-helpers';
import { Button } from '../../shared/ui/button';
import { Field, InputDirective } from '../../shared/ui/field';
import { Notice } from '../../shared/ui/notice';
import { PasswordInput } from '../../shared/ui/password-input';

const MESSAGES = {
  username: { required: 'Inserisci uno username.' },
  email: {
    required: 'Inserisci la tua email.',
    email: 'Inserisci un indirizzo email valido.',
  },
  password: {
    required: 'Scegli una password.',
    minlength: `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`,
  },
} as const;

@Component({
  selector: 'pp-register-page',
  imports: [ReactiveFormsModule, RouterLink, Button, Field, InputDirective, PasswordInput, Notice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-form.css',
  template: `
    <h1 class="title">Crea il tuo account</h1>

    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <pp-field label="Username" [error]="error('username')">
        <input
          ppInput
          type="text"
          formControlName="username"
          autocomplete="nickname"
          autocapitalize="off"
          spellcheck="false"
        />
      </pp-field>

      <pp-field label="Email" [error]="error('email') ?? emailTaken()">
        <input
          ppInput
          type="email"
          formControlName="email"
          autocomplete="email"
          inputmode="email"
          autocapitalize="off"
          spellcheck="false"
        />
      </pp-field>

      <pp-field
        label="Password"
        [error]="error('password')"
        [hint]="'Almeno ' + minLength + ' caratteri.'"
      >
        <pp-password-input formControlName="password" autocomplete="new-password" />
      </pp-field>

      <pp-field label="Conferma password" [error]="confirmError()">
        <pp-password-input formControlName="confirm" autocomplete="new-password" />
      </pp-field>

      <button ppButton class="submit" type="submit" [loading]="submitting()" [disabled]="submitting()">
        Crea account
      </button>

      @if (formError(); as message) {
        <pp-notice tone="error">{{ message }}</pp-notice>
      }
    </form>

    <p class="switch">Hai già un account? <a routerLink="/login">Accedi</a></p>
  `,
})
export class RegisterPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly minLength = MIN_PASSWORD_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      username: ['', requiredText],
      email: ['', [requiredText, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  /** Messaggio del server (409) mostrato sul campo email finché l'utente non lo modifica. */
  protected readonly emailTaken = signal<string | null>(null);

  constructor() {
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.emailTaken.set(null));
  }

  protected error(name: 'username' | 'email' | 'password'): string | null {
    return visibleError(this.form.controls[name], MESSAGES[name]);
  }

  protected confirmError(): string | null {
    const confirm = this.form.controls.confirm;
    if (!confirm.touched) {
      return null;
    }
    if (confirm.hasError('required')) {
      return 'Ripeti la password.';
    }
    return this.form.hasError('mismatch') ? 'Le password non coincidono.' : null;
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    const { username, email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.formError.set(null);

    this.session
      .register({ username: username.trim(), email: email.trim(), password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/vault']),
        error: (error: unknown) => this.onError(error),
      });
  }

  private onError(error: unknown): void {
    if (error instanceof SignInAfterRegistrationError) {
      this.session.notice.set('Account creato. Accedi per continuare.');
      void this.router.navigate(['/login']);
      return;
    }

    if (errorStatus(error) === 409) {
      this.emailTaken.set(errorMessage(error, 'Questa email è già in uso.'));
      this.form.controls.email.markAsTouched();
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    this.formError.set(errorMessage(error, 'Registrazione non riuscita. Riprova.'));
  }
}
