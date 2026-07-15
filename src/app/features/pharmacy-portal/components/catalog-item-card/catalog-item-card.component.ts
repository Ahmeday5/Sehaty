import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmacyCatalogItem } from '../../models/catalog.model';

@Component({
  selector: 'app-catalog-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-item-card.component.html',
  styleUrl: './catalog-item-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogItemCardComponent {
  item = input.required<PharmacyCatalogItem>();
  toggling = input(false);
  deleting = input(false);

  toggleAvailability = output<PharmacyCatalogItem>();
  delete = output<PharmacyCatalogItem>();

  protected imageFailed = false;

  protected onImageError(): void {
    this.imageFailed = true;
  }
}
