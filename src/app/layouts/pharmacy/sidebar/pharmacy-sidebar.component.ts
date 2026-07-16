import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';
import { PHARMACY_NAV_SECTIONS } from '../../../core/constants/pharmacy-nav.constants';

@Component({
  selector: 'app-pharmacy-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-sidebar.component.html',
  styleUrl: './pharmacy-sidebar.component.scss',
})
export class PharmacySidebarComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly sections = PHARMACY_NAV_SECTIONS;
}
