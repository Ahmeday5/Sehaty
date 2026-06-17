import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeType = 'success' | 'danger' | 'warning' | 'info' | 'secondary';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge-chip badge-chip--{{ type }}">{{ text }}</span>`,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input({ required: true }) text!: string;
  @Input() type: BadgeType = 'secondary';
}
