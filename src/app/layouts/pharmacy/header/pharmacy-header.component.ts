import {
  ChangeDetectionStrategy, Component, inject, computed, signal, HostListener, ElementRef,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { PharmacyAuthService } from '../../../core/services/pharmacy-auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PharmacyAuthApiService } from '../../../features/pharmacy-portal/services/pharmacy-auth-api.service';

@Component({
  selector: 'app-pharmacy-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-header.component.html',
  styleUrl: './pharmacy-header.component.scss',
})
export class PharmacyHeaderComponent {
  protected readonly auth = inject(PharmacyAuthService);
  protected readonly layout = inject(LayoutService);
  private readonly authApi = inject(PharmacyAuthApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly elRef = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: HTMLElement): void {
    if (this.dropdownOpen() && !this.elRef.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }

  protected readonly dropdownOpen = signal(false);

  protected readonly pharmacy = this.auth.currentPharmacy;

  protected readonly pharmacyImage = computed(() => {
    const img = this.pharmacy()?.imageUrl;
    return img && img.trim() ? img : '/assets/img/logo-login.png';
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
  closeDropdown(): void { this.dropdownOpen.set(false); }

  async logout(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'تسجيل الخروج',
      message: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      confirmText: 'خروج',
      cancelText: 'إلغاء',
      type: 'warning',
    });
    if (!ok) return;

    this.authApi.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.auth.logout();
    this.router.navigate(['/pharmacy/login'], { replaceUrl: true });
  }

  private getTitle(): string {
    const url = this.router.url.split('?')[0];
    if (url.startsWith('/pharmacy/dashboard')) return 'لوحة التحكم';
    if (url.startsWith('/pharmacy/profile')) return 'الملف الشخصي';
    if (url.startsWith('/pharmacy/catalog')) return 'كتالوج الأصناف';
    if (url.startsWith('/pharmacy/orders')) return 'إدارة الطلبات';
    if (url.startsWith('/pharmacy/prescriptions')) return 'مراجعة الروشتات';
    return 'بوابة الصيدلية';
  }
}
