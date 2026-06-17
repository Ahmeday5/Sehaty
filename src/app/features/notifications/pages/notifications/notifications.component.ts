import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from '../../services/notifications.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  private readonly svc   = inject(NotificationsService);
  private readonly toast = inject(ToastService);

  protected readonly sending = signal(false);
  protected title = '';
  protected body  = '';

  protected async onSend(): Promise<void> {
    if (!this.title.trim() || !this.body.trim()) {
      this.toast.warning('يرجى إدخال العنوان والمحتوى');
      return;
    }
    this.sending.set(true);
    try {
      await firstValueFrom(this.svc.send({ title: this.title, body: this.body }));
      this.toast.success('تم إرسال الإشعار');
      this.title = '';
      this.body  = '';
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الإرسال');
    } finally {
      this.sending.set(false);
    }
  }
}
