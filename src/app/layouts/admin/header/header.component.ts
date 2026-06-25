import {
  ChangeDetectionStrategy, Component, inject, computed, signal, HostListener, ElementRef,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly auth    = inject(AuthService);
  protected readonly layout  = inject(LayoutService);
  private  readonly confirm  = inject(ConfirmService);
  private  readonly router   = inject(Router);
  private  readonly elRef    = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: HTMLElement): void {
    if (this.dropdownOpen() && !this.elRef.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  protected readonly dropdownOpen = signal(false);

  protected readonly user = this.auth.currentUser;

  protected readonly userName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'مستخدم';
  });

  protected readonly userImage = computed(() => {
    const pic = this.user()?.picture;
    return pic && pic !== 'N/A' ? pic : '/assets/img/logo-login.png';
  });

  protected readonly pageTitle = signal('لوحة التحكم');

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.dropdownOpen.set(false);
        this.pageTitle.set(this.getTitle());
      });
  }

  toggleDropdown(): void { this.dropdownOpen.update((v) => !v); }
  closeDropdown():  void { this.dropdownOpen.set(false); }

  async logout(): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'تسجيل الخروج',
      message:     'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      confirmText: 'خروج',
      cancelText:  'إلغاء',
      type:        'warning',
    });
    if (ok) {
      this.auth.logout();
      this.router.navigate(['/splash'], { replaceUrl: true });
    }
  }

  private getTitle(): string {
    const url = this.router.url.split('?')[0];
    const map: Record<string, string> = {
      '/dashboard':      'لوحة التحكم',
      '/doctors':        'الأطباء',
      '/doctors/add':    'إضافة طبيب',
      '/users':          'المستخدمين',
      '/patients':       'المرضى',
      '/specialities':   'التخصصات',
      '/discounts':      'الخصومات والعروض',
      '/reports':        'التقارير',
      '/advertisements': 'الإعلانات',
      '/notifications':  'الإشعارات',
      '/privacy-policy': 'سياسة الخصوصية',
    };
    for (const [path, label] of Object.entries(map)) {
      if (url.startsWith(path)) return label;
    }
    return 'سهاتي';
  }
}
