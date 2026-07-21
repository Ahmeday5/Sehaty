import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  @Input({ required: true }) item!: Item;
  @Output() edit   = new EventEmitter<Item>();
  @Output() remove = new EventEmitter<Item>();

  private readonly base = environment.apiUrl.replace(/\/+$/, '');

  protected get imageSrc(): string | null {
    const url = this.item.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${this.base}/${url.replace(/^\//, '')}`;
  }

  protected get initials(): string {
    const name = this.item.nameAr?.trim();
    if (!name) return '?';
    return name[0].toUpperCase();
  }
}
