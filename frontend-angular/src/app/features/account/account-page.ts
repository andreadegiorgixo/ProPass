import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { errorMessage, errorStatus } from '../../core/api/api-error';
import { AccountUpdate } from '../../core/api/models';
import { SessionService } from '../../core/session/session-service';
import {
  MIN_PASSWORD_LENGTH,
  focusFirstInvalid,
  passwordsMatch,
  requiredText,
  visibleError,
} from '../../shared/forms/form-helpers';
import { Button } from '../../shared/ui/button';
import { ConfirmService } from '../../shared/ui/confirm';
import { Field, InputDirective } from '../../shared/ui/field';
import { Icon } from '../../shared/ui/icon';
import { Notice } from '../../shared/ui/notice';
import { PasswordInput } from '../../shared/ui/password-input';
import { ToastService } from '../../shared/ui/toast';

const PROFILE_MESSAGES = {
  username: { required: 'Inserisci uno username.' },
  email: {
    required: 'Inserisci la tua email.',
    email: 'Inserisci un indirizzo email valido.',
  },
} as const;

const PASSWORD_MESSAGES = {
  password: {
    required: 'Scegli una password.',
    minlength: `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`,
  },
} as const;

@Component({
  selector: 'pp-account-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    Button,
    Field,
    InputDirective,
    PasswordInput,
    Notice,
    Icon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './account-page.css',
  template: `
    <a class="back" routerLink="/vault">
      <pp-icon name="arrow-left" [size]="16" />
      Le tue password
    </a>

    @if (account(); as current) {
      <header class="head">
        <h1 class="title">Account</h1>
        <p class="meta">Creato il {{ current.creazioneAccount | date: 'd MMM y' }}</p>
      </header>

      <section class="section" aria-labelledby="profile-title">
        <h2 id="profile-title" class="section-title">Dati personali</h2>
        <form class="form" [formGroup]="profile" (ngSubmit)="saveProfile()" novalidate>
          <pp-field label="Username" [error]="profileError('username')">
            <input
              ppInput
              type="text"
              formControlName="username"
              autocomplete="nickname"
              autocapitalize="off"
              spellcheck="false"
            />
          </pp-field>

          <pp-field label="Email" [error]="profileError('email') ?? emailTaken()">
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

          <button
            ppButton
            class="action"
            type="submit"
            [loading]="savingProfile()"
            [disabled]="!canSaveProfile() || savingProfile()"
          >
            Salva modifiche
          </button>

          @if (profileFormError(); as message) {
            <pp-notice tone="error">{{ message }}</pp-notice>
          }
        </form>
      </section>

      <section class="section" aria-labelledby="password-title">
        <h2 id="password-title" class="section-title">Password dell'account</h2>
        <form class="form" [formGroup]="passwordForm" (ngSubmit)="savePassword()" novalidate>
          <pp-field
            label="Nuova password"
            [error]="passwordError()"
            [hint]="'Almeno ' + minLength + ' caratteri.'"
          >
            <pp-password-input formControlName="password" autocomplete="new-password" />
          </pp-field>

          <pp-field label="Conferma password" [error]="confirmError()">
            <pp-password-input formControlName="confirm" autocomplete="new-password" />
          </pp-field>

          <button
            ppButton
            class="action"
            type="submit"
            [loading]="savingPassword()"
            [disabled]="savingPassword()"
          >
            Aggiorna password
          </button>

          @if (passwordFormError(); as message) {
            <pp-notice tone="error">{{ message }}</pp-notice>
          }
        </form>
      </section>

      <section class="section" aria-labelledby="session-title">
        <h2 id="session-title" class="section-title">Sessione</h2>
        <p class="text">Esci da ProPass su questo dispositivo.</p>
        <button ppButton class="action" variant="secondary" type="button" (click)="logout()">
          Esci
        </button>
      </section>

      <section class="section" aria-labelledby="delete-title">
        <h2 id="delete-title" class="section-title">Elimina account</h2>
        <p class="text">
          Elimina il tuo account e tutte le password salvate. L'operazione non si può annullare.
        </p>
        <button
          ppButton
          class="action"
          variant="danger-outline"
          type="button"
          (click)="deleteAccount()"
        >
          Elimina account
        </button>
      </section>
    }
  `,
})
export class AccountPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly account = this.session.account;
  protected readonly minLength = MIN_PASSWORD_LENGTH;

  // ---- Dati personali ----

  protected readonly profile = this.fb.group({
    username: [this.session.account()?.username ?? '', requiredText],
    email: [this.session.account()?.email ?? '', [requiredText, Validators.email]],
  });

  private readonly profileValues = toSignal(this.profile.valueChanges, {
    initialValue: this.profile.getRawValue(),
  });

  /** Solo i campi diversi da quelli salvati: è ciò che si invia a PUT /account/me. */
  private readonly profileChanges = computed<AccountUpdate>(() => {
    const saved = this.session.account();
    const values = this.profileValues();
    const changes: AccountUpdate = {};
    if (!saved) {
      return changes;
    }

    const username = (values.username ?? '').trim();
    const email = (values.email ?? '').trim();
    if (username !== '' && username !== saved.username) {
      changes.username = username;
    }
    if (email !== '' && email !== saved.email) {
      changes.email = email;
    }
    return changes;
  });

  protected readonly canSaveProfile = computed(
    () => Object.keys(this.profileChanges()).length > 0,
  );
  protected readonly savingProfile = signal(false);
  protected readonly profileFormError = signal<string | null>(null);
  protected readonly emailTaken = signal<string | null>(null);

  // ---- Password dell'account ----

  protected readonly passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly savingPassword = signal(false);
  protected readonly passwordFormError = signal<string | null>(null);

  constructor() {
    this.profile.controls.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.emailTaken.set(null));
  }

  protected profileError(name: 'username' | 'email'): string | null {
    return visibleError(this.profile.controls[name], PROFILE_MESSAGES[name]);
  }

  protected passwordError(): string | null {
    return visibleError(this.passwordForm.controls.password, PASSWORD_MESSAGES.password);
  }

  protected confirmError(): string | null {
    const confirm = this.passwordForm.controls.confirm;
    if (!confirm.touched) {
      return null;
    }
    if (confirm.hasError('required')) {
      return 'Ripeti la password.';
    }
    return this.passwordForm.hasError('mismatch') ? 'Le password non coincidono.' : null;
  }

  protected saveProfile(): void {
    if (this.savingProfile()) {
      return;
    }
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    const changes = this.profileChanges();
    if (Object.keys(changes).length === 0) {
      return;
    }

    this.savingProfile.set(true);
    this.profileFormError.set(null);
    this.emailTaken.set(null);

    this.session
      .updateAccount(changes)
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: (account) => {
          this.profile.reset({ username: account.username, email: account.email });
          this.toast.success('Account aggiornato');
        },
        error: (error: unknown) => {
          if (errorStatus(error) === 409) {
            this.emailTaken.set(errorMessage(error, 'Questa email è già in uso.'));
            this.profile.controls.email.markAsTouched();
            focusFirstInvalid(this.host.nativeElement, this.injector);
          } else {
            this.profileFormError.set(
              errorMessage(error, 'Non è stato possibile salvare le modifiche.'),
            );
          }
        },
      });
  }

  protected savePassword(): void {
    if (this.savingPassword()) {
      return;
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    this.savingPassword.set(true);
    this.passwordFormError.set(null);

    this.session
      .updateAccount({ password: this.passwordForm.controls.password.value })
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset({ password: '', confirm: '' });
          this.toast.success('Password aggiornata');
        },
        error: (error: unknown) =>
          this.passwordFormError.set(
            errorMessage(error, 'Non è stato possibile aggiornare la password.'),
          ),
      });
  }

  protected logout(): void {
    this.session.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => this.toast.error('Non è stato possibile uscire. Riprova.'),
    });
  }

  protected async deleteAccount(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminare il tuo account?',
      message: "Verranno eliminate anche tutte le password salvate. L'operazione non si può annullare.",
      confirmLabel: 'Elimina account',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.session.deleteAccount().subscribe({
      next: () => {
        this.session.notice.set('Il tuo account è stato eliminato.');
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) =>
        this.toast.error(errorMessage(error, 'Non è stato possibile eliminare l\'account.')),
    });
  }
}
