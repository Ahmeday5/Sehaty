import {
  ChangeDetectionStrategy, Component, inject, computed, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastPosition } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent implements OnDestroy {
  protected readonly svc = inject(ToastService);

  protected positionClass = computed(() => `toast-stack--${this.svc.position()}`);

  protected progressPercent(toast: Toast): number {
    if (toast.duration === 0 || toast.pausedAt !== null) return this.lastPercent;
    const elapsed = Date.now() - toast.createdAt - toast.pausedFor;
    return Math.max(0, Math.min(100, (elapsed / toast.duration) * 100));
  }

  private lastPercent = 0;

  trackById(_: number, toast: Toast): string { return toast.id; }

  dismiss(id: string): void { this.svc.dismiss(id); }
  pause (id: string): void  { this.svc.pause(id); }
  resume(id: string): void  { this.svc.resume(id); }

  callAction(toast: Toast): void {
    toast.action?.handler();
    this.svc.dismiss(toast.id);
  }

  ngOnDestroy(): void { this.svc.clear(); }
}
