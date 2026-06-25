import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatVariant = 'green' | 'red' | 'amber' | 'blue' | 'teal' | 'purple' | 'primary' | 'default';

@Component({
  selector: 'app-stat-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="sb-badge sb-badge--{{ variant() }}">
      @if (dot()) { <span class="sb-dot"></span> }
      {{ label() }}
    </span>
  `,
  styleUrl: './stat-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatBadgeComponent {
  label   = input.required<string>();
  variant = input<StatVariant>('default');
  dot     = input(false);
}
