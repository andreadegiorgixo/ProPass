import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Info,
  LogOut,
  LucideAngularModule,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-angular';

const ICONS = {
  alert: CircleAlert,
  'arrow-left': ArrowLeft,
  check: Check,
  'chevron-down': ChevronDown,
  copy: Copy,
  eye: Eye,
  'eye-off': EyeOff,
  info: Info,
  'log-out': LogOut,
  more: Ellipsis,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  trash: Trash2,
  user: User,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

/** Un solo punto di accesso alle icone Lucide: tratto 1.75, 20px, colore del testo. */
@Component({
  selector: 'pp-icon',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
  template: `<lucide-icon [img]="icon()" [size]="size()" [strokeWidth]="1.75" />`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  protected readonly icon = computed(() => ICONS[this.name()]);
}
