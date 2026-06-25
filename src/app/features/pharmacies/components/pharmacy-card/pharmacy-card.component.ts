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

  edit         = output<Pharmacy>();
  toggleActive = output<Pharmacy>();
  delete       = output<Pharmacy>();

  protected get initials(): string {
    return this.pharmacy().name.charAt(0) ?? 'ص';
  }
}
