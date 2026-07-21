import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NavIconName =
  | 'house' | 'doctors' | 'add-user' | 'users' | 'patients' | 'specialities'
  | 'discount' | 'ads' | 'bell' | 'chart' | 'document' | 'logout' | 'settings'
  | 'pharmacy' | 'calendar' | 'prescription' | 'finance' | 'approvals' | 'support' | 'audit'
  | 'reports' | 'doctor-map' | 'ratings' | 'item-groups' | 'items';

const ICON_CLASSES: Record<NavIconName, string> = {
  'house':        'fa-solid fa-house',
  'doctors':      'fa-solid fa-user-doctor',
  'add-user':     'fa-solid fa-user-plus',
  'users':        'fa-solid fa-users',
  'patients':     'fa-solid fa-user-injured',
  'specialities': 'fa-solid fa-stethoscope',
  'discount':     'fa-solid fa-percent',
  'ads':          'fa-solid fa-bullhorn',
  'bell':         'fa-solid fa-bell',
  'chart':        'fa-solid fa-chart-bar',
  'document':     'fa-solid fa-file-contract',
  'logout':       'fa-solid fa-right-from-bracket',
  'settings':     'fa-solid fa-gear',
  'pharmacy':     'fa-solid fa-pills',
  'calendar':     'fa-solid fa-calendar-check',
  'prescription': 'fa-solid fa-file-prescription',
  'finance':      'fa-solid fa-money-bill-wave',
  'approvals':    'fa-solid fa-clipboard-check',
  'support':      'fa-solid fa-headset',
  'audit':        'fa-solid fa-scroll',
  'reports':      'fa-solid fa-file-export',
  'doctor-map':   'fa-solid fa-map-location-dot',
  'ratings':      'fa-solid fa-star-half-stroke',
  'item-groups':  'fa-solid fa-sitemap',
  'items':        'fa-solid fa-boxes-stacked',
};

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<i [class]="iconClass" [style.font-size.px]="size"></i>`,
})
export class NavIconComponent {
  @Input() name!: NavIconName;
  @Input() size = 16;

  get iconClass(): string {
    return ICON_CLASSES[this.name] ?? 'fa-solid fa-circle-question';
  }
}
