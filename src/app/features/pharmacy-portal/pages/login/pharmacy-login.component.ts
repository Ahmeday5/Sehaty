import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PharmacyAuthService } from '../../../../core/services/pharmacy-auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PharmacyAuthApiService } from '../../services/pharmacy-auth-api.service';

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
  private readonly auth = inject(PharmacyAuthService);
  private readonly authApi = inject(PharmacyAuthApiService);
  private readonly toast = inject(ToastService);

  protected phone = signal(this.auth.getSavedPhone() ?? '');
  protected password = signal('');
  protected rememberMe = signal(!!this.auth.getSavedPhone());
  protected showPassword = signal(false);
  protected isLoading = signal(false);

  togglePassword(): void { this.showPassword.update((v) => !v); }

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
      this.router.navigate(['/pharmacy/profile']);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'رقم الهاتف أو كلمة المرور غير صحيحة.';
      this.toast.error(msg, { title: 'فشل تسجيل الدخول' });
    } finally {
      this.isLoading.set(false);
    }
  }
}
