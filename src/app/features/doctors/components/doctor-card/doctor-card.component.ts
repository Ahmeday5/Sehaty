import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-card.component.html',
  styleUrl: './doctor-card.component.scss',
})
export class DoctorCardComponent {
  @Input({ required: true }) doctor!: Doctor;
  @Output() edit   = new EventEmitter<Doctor>();
  @Output() toggle = new EventEmitter<Doctor>();
  @Output() delete = new EventEmitter<Doctor>();

  private readonly BASE = 'https://sehatytheone.runasp.net/';

  protected get imageUrl(): string {
    const img = this.doctor.doctorImage;
    if (!img || img === this.BASE || img === 'https://sehatytheone.runasp.net') {
      return '/assets/img/default-doctor.png';
    }
    return img.startsWith('http') ? img : `${this.BASE}${img}`;
  }

  protected get initials(): string {
    return (this.doctor.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
}
