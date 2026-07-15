import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterItem } from '../../models/catalog.model';

@Component({
  selector: 'app-master-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './master-item-card.component.html',
  styleUrl: './master-item-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterItemCardComponent {
  item = input.required<MasterItem>();
  adding = input(false);

  add = output<MasterItem>();

  protected imageFailed = false;

  protected onImageError(): void {
    this.imageFailed = true;
  }
}
