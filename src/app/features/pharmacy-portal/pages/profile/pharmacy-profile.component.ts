import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PharmacyAuthService } from '../../../../core/services/pharmacy-auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PharmacyAuthApiService } from '../../services/pharmacy-auth-api.service';

@Component({
  selector: 'app-pharmacy-profile',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-profile.component.html',
  styleUrl: './pharmacy-profile.component.scss',
})
export class PharmacyProfileComponent implements OnInit {
  private readonly authApi = inject(PharmacyAuthApiService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(PharmacyAuthService);

  protected readonly isLoading = signal(false);
  protected readonly pharmacy = this.auth.currentPharmacy;

  protected readonly initials = computed(() => {
    const name = this.pharmacy()?.name?.trim() ?? '';
    return name ? name.charAt(0) : 'ص';
  });

  protected readonly mapUrl = computed(() => {
    const p = this.pharmacy();
    if (!p) return null;
    return `https://www.google.com/maps?q=${p.lat},${p.lng}`;
  });

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      const profile = await firstValueFrom(this.authApi.getProfile());
      this.auth.updateSession(profile);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'تعذر تحميل بيانات الصيدلية.';
      this.toast.error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async copyToClipboard(value: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success(`تم نسخ ${label}`);
    } catch {
      this.toast.error('تعذر النسخ إلى الحافظة');
    }
  }
}
