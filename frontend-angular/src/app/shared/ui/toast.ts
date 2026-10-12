import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

import { Icon } from './icon';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

const DISMISS_AFTER_MS = 4000;

/** Conferme brevi dopo un'azione ("Password salvata"). Spariscono da sole dopo 4 secondi. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly list = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.list.asReadonly();

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.list.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, tone: Toast['tone']): void {
    // Lo stesso messaggio già a schermo non si impila: gli si rinnova solo il tempo.
    const same = this.list().find((toast) => toast.message === message && toast.tone === tone);
    if (same) {
      this.schedule(same.id);
      return;
    }

    const id = this.nextId++;
    // Al massimo tre alla volta: i più vecchi lasciano il posto.
    this.list.update((toasts) => [...toasts.slice(-2), { id, message, tone }]);
    this.schedule(id);
  }

  private schedule(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.set(id, setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS));
  }
}

/**
 * Area dei toast, sempre presente nella pagina: l'area `status` annuncia ogni messaggio che vi
 * compare agli screen reader, senza spostare il focus.
 */
@Component({
  selector: 'pp-toast-host',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      position: fixed;
      right: var(--gutter);
      bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
      left: var(--gutter);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      max-width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--color-text);
      border-radius: var(--radius-control);
      color: var(--color-bg);
      font-size: var(--text-16);
      pointer-events: auto;
      animation: toast-in var(--motion-base) var(--ease-out);
    }

    .toast--error {
      background: var(--color-danger);
      color: var(--color-on-danger);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }
  `,
  template: `
    <div class="region" role="status" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class.toast--error]="toast.tone === 'error'">
          <pp-icon [name]="toast.tone === 'error' ? 'alert' : 'check'" />
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService).toasts;
}
