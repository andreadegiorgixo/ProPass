import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { PasswordDto } from '../../core/api/models';
import { firstLetter } from '../../shared/text';
import { Icon } from '../../shared/ui/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { displayLink, safeHref } from './link';

/** Una riga del vault: monogramma, nome, link, username, password mascherata e azioni. */
@Component({
  selector: 'pp-password-row',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './password-row.css',
  template: `
    <article class="row" [class.row--selected]="selected()">
      <span class="mono" aria-hidden="true">{{ initial() }}</span>

      <div class="site">
        <h2 class="name">{{ item().nomePassword }}</h2>
        @if (href(); as url) {
          <a class="link" [href]="url" target="_blank" rel="noopener noreferrer">{{ shownLink() }}</a>
        } @else {
          <span class="link">{{ shownLink() }}</span>
        }
      </div>

      <p class="user"><span class="sr-only">Username: </span>{{ item().username }}</p>

      <div class="secret">
        @if (revealed()) {
          <code class="secret-text"><span class="sr-only">Password: </span>{{ item().password }}</code>
        } @else {
          <code class="secret-text" aria-hidden="true">{{ mask }}</code>
          <span class="sr-only">Password nascosta</span>
        }
        <button
          ppIconButton
          type="button"
          [label]="(revealed() ? 'Nascondi password di ' : 'Mostra password di ') + item().nomePassword"
          [attr.aria-pressed]="revealed()"
          (click)="revealed.set(!revealed())"
        >
          <pp-icon [name]="revealed() ? 'eye-off' : 'eye'" />
        </button>
        <button
          ppIconButton
          type="button"
          [label]="'Copia password di ' + item().nomePassword"
          (click)="copy.emit(item())"
        >
          <pp-icon name="copy" />
        </button>
      </div>

      <button
        ppIconButton
        class="more"
        type="button"
        [label]="'Altre azioni per ' + item().nomePassword"
        [cdkMenuTriggerFor]="actions"
        [cdkMenuPosition]="menuPosition"
      >
        <pp-icon name="more" />
      </button>
    </article>

    <ng-template #actions>
      <div class="pp-menu" cdkMenu [attr.aria-label]="'Azioni per ' + item().nomePassword">
        <button class="pp-menu-item" type="button" cdkMenuItem (cdkMenuItemTriggered)="choose('edit')">
          <pp-icon name="pencil" />
          Modifica
        </button>
        <button
          class="pp-menu-item pp-menu-item--danger"
          type="button"
          cdkMenuItem
          (cdkMenuItemTriggered)="choose('remove')"
        >
          <pp-icon name="trash" />
          Elimina
        </button>
      </div>
    </ng-template>
  `,
})
export class PasswordRow {
  readonly item = input.required<PasswordDto>();
  /** La riga è quella aperta nel pannello di modifica. */
  readonly selected = input(false);

  readonly copy = output<PasswordDto>();
  readonly edit = output<PasswordDto>();
  readonly remove = output<PasswordDto>();

  protected readonly revealed = signal(false);
  /** Lunghezza fissa: la password mascherata non rivela quanto è lunga. */
  protected readonly mask = '••••••••••';

  protected readonly initial = computed(() => firstLetter(this.item().nomePassword));
  protected readonly href = computed(() => safeHref(this.item().link));
  protected readonly shownLink = computed(() => displayLink(this.item().link));

  protected readonly menuPosition: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  ];

  protected choose(action: 'edit' | 'remove'): void {
    // Il menu, chiudendosi, rimette il focus sul suo pulsante: l'azione parte subito dopo,
    // così una finestra aperta da qui non si vede sottrarre il focus.
    setTimeout(() => (action === 'edit' ? this.edit : this.remove).emit(this.item()));
  }
}
