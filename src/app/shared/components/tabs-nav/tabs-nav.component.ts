import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabDef } from './tabs-nav.model';

@Component({
  selector: 'app-tabs-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs-nav.component.html',
  styleUrl: './tabs-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsNavComponent {
  tabs      = input.required<TabDef[]>();
  activeTab = input.required<string>();
  tabChange = output<string>();
}
