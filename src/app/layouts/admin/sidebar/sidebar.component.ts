import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import { NavIconComponent, NavIconName } from '../../../shared/components/nav-icon/nav-icon.component';
import { NAV_SECTIONS } from '../../../core/constants/nav.constants';
import { UserRole } from '../../../core/models/auth.model';
import { getBadgeClass, BadgeType } from '../../../core/constants/badge.constants';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: NavIconName;
  badge?: string;
  badgeType?: BadgeType;
  requiredAnyRole?: ReadonlyArray<UserRole>;
  hideForRoles?:    ReadonlyArray<UserRole>;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly layout = inject(LayoutService);
  private  readonly auth   = inject(AuthService);

  protected readonly visibleSections = computed(() => {
    const role = this.auth.primaryRole();
    return NAV_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.hideForRoles?.length && role && item.hideForRoles.includes(role)) return false;
          if (!item.requiredAnyRole?.length) return true;
          return !!role && item.requiredAnyRole.includes(role);
        }),
      }))
      .filter((s) => s.items.length > 0);
  });

  protected getBadgeClass(type?: BadgeType): string {
    return getBadgeClass(type);
  }
}
