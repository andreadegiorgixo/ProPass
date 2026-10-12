import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { errorMessage } from '../../core/api/api-error';
import { SessionService } from '../../core/session/session-service';
import { focusFirstInvalid, requiredText, visibleError } from '../../shared/forms/form-helpers';
import { Button } from '../../shared/ui/button';
import { Field, InputDirective } from '../../shared/ui/field';
import { Notice } from '../../shared/ui/notice';
import { PasswordInput } from '../../shared/ui/password-input';

const MESSAGES = {
  email: {
    required: 'Inserisci la tua email.',
    email: 'Inserisci un indirizzo email valido.',
  },
  password: {
    required: 'Inserisci la password.',
  },
} as const;

@Component({
  selector: 'pp-login-page',
  imports: [ReactiveFormsModule, RouterLink, Button, Field, InputDirective, PasswordInput, Notice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-form.css',
  template: `
    <h1 class="title">Accedi</h1>

    @if (session.notice(); as notice) {
      <pp-notice class="notice" tone="info">{{ notice }}</pp-notice>
    }
    @if (session.serverUnreachable()) {
      <pp-notice class="notice" tone="error">
        Il server non risponde. Controlla che il backend sia acceso e ricarica la pagina.
      </pp-notice>
    }

    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <pp-field label="Email" [error]="error('email')">
        <input
          ppInput
          type="email"
          formControlName="email"
          autocomplete="username"
          inputmode="email"
          autocapitalize="off"
          spellcheck="false"
        />
      </pp-field>

      <pp-field label="Password" [error]="error('password')">
        <pp-password-input formControlName="password" autocomplete="current-password" />
      </pp-field>

      <button ppButton class="submit" type="submit" [loading]="submitting()" [disabled]="submitting()">
        Accedi
      </button>

      @if (formError(); as message) {
        <pp-notice tone="error">{{ message }}</pp-notice>
      }
    </form>

    <p class="switch">Non hai un account? <a routerLink="/registrazione">Registrati</a></p>
  `,
})
export class LoginPage {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [requiredText, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected error(name: 'email' | 'password'): string | null {
    return visibleError(this.form.controls[name], MESSAGES[name]);
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

    const { email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.formError.set(null);

    this.session
      .login({ email: email.trim(), password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/vault']),
        error: (error: unknown) =>
          this.formError.set(errorMessage(error, 'Accesso non riuscito. Riprova.')),
      });
  }
}
