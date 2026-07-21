import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PharmacyAuthService } from '../../../../core/services/pharmacy-auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PharmacyAuthApiService } from '../../services/pharmacy-auth-api.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-pharmacy-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './pharmacy-login.component.html',
  styleUrl: './pharmacy-login.component.scss',
})
export class PharmacyLoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(PharmacyAuthService);
  private readonly authApi = inject(PharmacyAuthApiService);
  private readonly toast = inject(ToastService);

  protected readonly mode = signal<AuthMode>(
    this.route.snapshot.data['mode'] === 'register' ? 'register' : 'login',
  );

  constructor() {
    this.route.data.subscribe((data) => {
      this.mode.set(data['mode'] === 'register' ? 'register' : 'login');
    });
  }

  // ── login state ──
  protected phone = signal(this.auth.getSavedPhone() ?? '');
  protected password = signal('');
  protected rememberMe = signal(!!this.auth.getSavedPhone());
  protected showPassword = signal(false);
  protected isLoading = signal(false);

  // ── register state ──
  protected regName = signal('');
  protected regPhone = signal('');
  protected regPassword = signal('');
  protected regConfirmPassword = signal('');
  protected regAddress = signal('');
  protected regLat = signal('');
  protected regLng = signal('');
  protected regShowPassword = signal(false);
  protected regIsLoading = signal(false);
  protected regImageFile = signal<File | null>(null);
  protected regImagePreview = signal<string | null>(null);
  protected regImageError = signal<string | null>(null);
  protected locatingMe = signal(false);

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleRegPassword(): void {
    this.regShowPassword.update((v) => !v);
  }

  switchMode(target: AuthMode): void {
    if (this.mode() === target) return;
    this.mode.set(target);
    this.router.navigate(['/pharmacy', target], { replaceUrl: true });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.regImageError.set(null);

    if (!file) {
      this.regImageFile.set(null);
      this.regImagePreview.set(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.regImageError.set('يرجى اختيار ملف صورة صالح.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.regImageError.set('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
      input.value = '';
      return;
    }

    this.regImageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.regImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearImage(fileInput: HTMLInputElement): void {
    this.regImageFile.set(null);
    this.regImagePreview.set(null);
    this.regImageError.set(null);
    fileInput.value = '';
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.toast.warning('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      return;
    }
    this.locatingMe.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.regLat.set(String(pos.coords.latitude));
        this.regLng.set(String(pos.coords.longitude));
        this.locatingMe.set(false);
        this.toast.success('تم تحديد الموقع الحالي بنجاح.');
      },
      () => {
        this.locatingMe.set(false);
        this.toast.error('تعذر الحصول على الموقع الحالي.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      this.toast.error('يرجى تعبئة جميع الحقول بشكل صحيح.');
      return;
    }

    this.isLoading.set(true);
    try {
      const session = await firstValueFrom(
        this.authApi.login({
          phone: this.phone(),
          password: this.password(),
          rememberMe: this.rememberMe(),
        }),
      );
      this.auth.login(session, this.rememberMe());
      this.router.navigate(['/pharmacy/dashboard']);
    } catch (err: any) {
      const msg =
        err?.error?.message ??
        err?.message ??
        'رقم الهاتف أو كلمة المرور غير صحيحة.';
      this.toast.error(msg, { title: 'فشل تسجيل الدخول' });
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegisterSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      this.toast.error('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح.');
      return;
    }

    if (this.regPassword() !== this.regConfirmPassword()) {
      this.toast.error('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    this.regIsLoading.set(true);
    try {
      await firstValueFrom(
        this.authApi.register({
          name: this.regName(),
          phone: this.regPhone(),
          password: this.regPassword(),
          address: this.regAddress(),
          lat: this.regLat() || undefined,
          lng: this.regLng() || undefined,
          image: this.regImageFile(),
        }),
      );

      const submittedPhone = this.regPhone();
      this.toast.success(
        'تم استلام طلب انضمام صيدليتك بنجاح. يرجى انتظار موافقة الإدارة على الحساب قبل تسجيل الدخول.',
        { title: 'تم إنشاء الطلب', duration: 8000 },
      );

      this.phone.set(submittedPhone);
      this.resetRegisterForm();
      this.switchMode('login');
    } catch (err: any) {
      const msg =
        err?.error?.message ??
        err?.message ??
        'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى.';
      this.toast.error(msg, { title: 'فشل إنشاء الحساب' });
    } finally {
      this.regIsLoading.set(false);
    }
  }

  private resetRegisterForm(): void {
    this.regName.set('');
    this.regPhone.set('');
    this.regPassword.set('');
    this.regConfirmPassword.set('');
    this.regAddress.set('');
    this.regLat.set('');
    this.regLng.set('');
    this.regImageFile.set(null);
    this.regImagePreview.set(null);
    this.regImageError.set(null);
  }
}
