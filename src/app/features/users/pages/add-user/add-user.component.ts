import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss',
})
export class AddUserComponent {
  private readonly svc    = inject(UsersService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected showPassword = signal(false);

  user = { firstName:'', lastName:'', email:'', phone:'', nationalID:'', password:'', role:'', imageFile: null as File | null };

  togglePassword(): void { this.showPassword.update((v) => !v); }
  onFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.user.imageFile = f;
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) { this.toast.error('يرجى تعبئة جميع الحقول.'); return; }
    this.loading.set(true);
    try {
      const fd = new FormData();
      fd.append('FirstName',  this.user.firstName);
      fd.append('LastName',   this.user.lastName);
      fd.append('Email',      this.user.email);
      fd.append('Password',   this.user.password);
      fd.append('Phone',      this.user.phone);
      fd.append('NationalID', this.user.nationalID);
      fd.append('Roles',      this.user.role);
      if (this.user.imageFile) fd.append('ProfileImage', this.user.imageFile);
      const res = await firstValueFrom(this.svc.addUser(fd));
      if (res.includes('Added Successfully') || res.includes('تم')) {
        this.toast.success('تم إضافة المستخدم بنجاح');
        this.router.navigate(['/users']);
      } else {
        this.toast.error(res || 'فشل الإضافة');
      }
    } catch (err: any) {
      this.toast.error(err?.message ?? 'حدث خطأ');
    } finally {
      this.loading.set(false);
    }
  }
}
