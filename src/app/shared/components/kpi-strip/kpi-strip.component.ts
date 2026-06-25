import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiItem } from './kpi-strip.model';

@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-strip.component.html',
  styleUrl: './kpi-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiStripComponent {
  items = input.required<KpiItem[]>();
  clickable = input(false);
  itemClick = output<KpiItem>();

  protected onClick(item: KpiItem): void {
    if (this.clickable()) this.itemClick.emit(item);
  }
}
