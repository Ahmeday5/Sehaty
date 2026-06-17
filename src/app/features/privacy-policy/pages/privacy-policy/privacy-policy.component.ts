import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly saving  = signal(false);
  protected content = '';

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.api.getText('api/Dashboard/getPrivacyPolicy').subscribe({
      next: (res) => { this.content = res ?? ''; this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  protected async onSave(): Promise<void> {
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.putText('api/Dashboard/updatePrivacyPolicy', { content: this.content }));
      this.toast.success('تم حفظ سياسة الخصوصية');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الحفظ');
    } finally {
      this.saving.set(false);
    }
  }
}
