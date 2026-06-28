import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dmap-page" dir="rtl">
      <div class="page-header">
        <h1 class="page-title">خريطة الأطباء</h1>
      </div>
      <div class="dmap-coming-soon">
        <i class="fa-solid fa-map-location-dot"></i>
        <h2>قريباً</h2>
        <p>عرض تفاعلي لمواقع الأطباء على الخريطة</p>
      </div>
    </div>
  `,
  styles: [`
    .dmap-page { padding: 4px 0; }
    .dmap-coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 80px 20px;
      color: var(--textsub);
      text-align: center;
      i { font-size: 52px; color: var(--border); }
      h2 { font-size: 22px; font-weight: 800; color: var(--text); margin: 0; }
      p  { font-size: 14px; margin: 0; }
    }
  `],
})
export class DoctorMapComponent {}
