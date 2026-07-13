import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pharmacy } from '../../models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pharmacy-card.component.html',
  styleUrl: './pharmacy-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PharmacyCardComponent {
  pharmacy = input.required<Pharmacy>();

  toggleActive = output<Pharmacy>();
  delete       = output<Pharmacy>();

  protected imageFailed = false;

  protected get hasCoordinates(): boolean {
    const p = this.pharmacy();
    return !!p.lat && !!p.lng && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng));
  }

  protected get googleMapsUrl(): string {
    const p = this.pharmacy();
    return `https://www.google.com/maps?q=${p.lat},${p.lng}`;
  }

  protected onImageError(): void {
    this.imageFailed = true;
  }
}
