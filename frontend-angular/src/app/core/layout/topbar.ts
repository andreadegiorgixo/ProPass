import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { firstLetter } from '../../shared/text';
import { Icon } from '../../shared/ui/icon';
import { Logo } from '../../shared/ui/logo';
import { ToastService } from '../../shared/ui/toast';
import { SessionService } from '../session/session-service';

@Component({
  selector: 'pp-topbar',
  imports: [RouterLink, CdkMenu, CdkMenuItem, CdkMenuTrigger, Logo, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
    }

    .inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: var(--content-max);
      height: 4rem;
      margin: 0 auto;
      padding: 0 var(--gutter);
    }

    .home {
      display: inline-flex;
      border-radius: var(--radius-control);
      text-decoration: none;
    }

    .account {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: var(--control-height);
      padding: 0 var(--space-2) 0 var(--space-1);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-control);
      color: var(--color-text);
      font-weight: var(--weight-medium);
      touch-action: manipulation;
    }

    @media (hover: hover) {
      .account:hover {
        background: var(--color-surface-muted);
      }
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      background: var(--color-primary-tint);
      border-radius: var(--radius-control);
      color: var(--color-primary);
      font-weight: var(--weight-title);
    }

    /* Sotto i 480px resta solo l'iniziale; il nome resta per gli screen reader. */
    .name {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (min-width: 30rem) {
      .name {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip-path: none;
      }
    }
  `,
  template: `
    <header class="inner">
      <a class="home" routerLink="/vault" aria-label="ProPass, le tue password">
        <pp-logo />
      </a>

      <!-- Nessun aria-label: il nome accessibile è lo username visibile (WCAG 2.5.3). -->
      <button
        type="button"
        class="account"
        [cdkMenuTriggerFor]="accountMenu"
        [cdkMenuPosition]="menuPosition"
      >
        <span class="avatar" aria-hidden="true">{{ initial() }}</span>
        <span class="name">{{ username() }}</span>
        <pp-icon name="chevron-down" [size]="16" />
      </button>
    </header>

    <ng-template #accountMenu>
      <div class="pp-menu" cdkMenu aria-label="Account">
        <a class="pp-menu-item" cdkMenuItem routerLink="/account">
          <pp-icon name="user" />
          Account
        </a>
        <button class="pp-menu-item" type="button" cdkMenuItem (cdkMenuItemTriggered)="logout()">
          <pp-icon name="log-out" />
          Esci
        </button>
      </div>
    </ng-template>
  `,
})
export class Topbar {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly username = computed(() => this.session.account()?.username ?? '');
  protected readonly initial = computed(() => firstLetter(this.username()));

  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  ];

  protected logout(): void {
    this.session.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => this.toast.error('Non è stato possibile uscire. Riprova.'),
    });
  }
}
