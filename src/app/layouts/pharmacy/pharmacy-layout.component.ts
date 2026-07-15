import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../core/services/layout.service';
import { PharmacyHeaderComponent } from './header/pharmacy-header.component';
import { PharmacySidebarComponent } from './sidebar/pharmacy-sidebar.component';

@Component({
  selector: 'app-pharmacy-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, PharmacyHeaderComponent, PharmacySidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-layout.component.html',
  styleUrl: './pharmacy-layout.component.scss',
})
export class PharmacyLayoutComponent {
  protected readonly layout = inject(LayoutService);
}
