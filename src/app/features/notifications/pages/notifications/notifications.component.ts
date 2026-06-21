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

  protected form = {
    title:    '',
    body:     '',
    topic:    '',
    imageUrl: '',
  };

  protected get bodyLength(): number { return this.form.body.length; }

  protected async onSend(): Promise<void> {
    const { title, body, topic } = this.form;
    if (!title.trim()) { this.toast.warning('يرجى إدخال عنوان الإشعار'); return; }
    if (!body.trim())  { this.toast.warning('يرجى إدخال محتوى الإشعار'); return; }
    if (!topic.trim()) { this.toast.warning('يرجى اختيار الفئة المستهدفة'); return; }

    this.sending.set(true);
    try {
      const payload: any = { title: title.trim(), body: body.trim(), topic: topic.trim() };
      if (this.form.imageUrl.trim()) payload.imageUrl = this.form.imageUrl.trim();

      await firstValueFrom(this.svc.send(payload));
      this.toast.success('تم إرسال الإشعار بنجاح');
      this.form = { title: '', body: '', topic: '', imageUrl: '' };
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل إرسال الإشعار');
    } finally {
      this.sending.set(false);
    }
  }

  protected reset(): void {
    this.form = { title: '', body: '', topic: '', imageUrl: '' };
  }
}
