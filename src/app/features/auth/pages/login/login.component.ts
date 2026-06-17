import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly router   = inject(Router);
  private readonly auth     = inject(AuthService);
  private readonly authApi  = inject(AuthApiService);
  private readonly toast    = inject(ToastService);

  protected email        = signal(this.auth.getSavedEmail() ?? '');
  protected password     = signal('');
  protected rememberMe   = signal(!!this.auth.getSavedEmail());
  protected showPassword = signal(false);
  protected isLoading    = signal(false);

  togglePassword(): void { this.showPassword.update((v) => !v); }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      this.toast.error('يرجى تعبئة جميع الحقول بشكل صحيح.');
      return;
    }

    this.isLoading.set(true);
    try {
      const user = await firstValueFrom(
        this.authApi.login({
          email:      this.email(),
          password:   this.password(),
          rememberMe: this.rememberMe(),
        }),
      );
      this.auth.login(user);
      this.navigateByRole(user.roles);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      this.toast.error(msg, { title: 'فشل تسجيل الدخول' });
    } finally {
      this.isLoading.set(false);
    }
  }

  private navigateByRole(roles: string[]): void {
    if (roles.includes('Admin'))              this.router.navigate(['/dashboard']);
    else if (roles.includes('Sales') || roles.includes('Editor')) this.router.navigate(['/doctors']);
    else if (roles.includes('Marketing'))     this.router.navigate(['/advertisements']);
    else                                      this.router.navigate(['/dashboard']);
  }
}
