import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  SettingsBundle,
  SystemSettings,
  NotificationSettings,
  AppearanceSettings,
} from '../../models/settings.model';

type ActiveTab = 'system' | 'notifications' | 'appearance';

@Component({
  selector: 'app-settings-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-home.component.html',
  styleUrl: './settings-home.component.scss',
})
export class SettingsHomeComponent implements OnInit {
  private readonly svc   = inject(SettingsService);
  private readonly toast = inject(ToastService);

  // ── State ─────────────────────────────────────────────────────────────────
  protected readonly loading      = signal(true);
  protected readonly savingSystem = signal(false);
  protected readonly savingNotif  = signal(false);
  protected readonly savingApp    = signal(false);
  protected readonly activeTab    = signal<ActiveTab>('system');

  // ── Form models ───────────────────────────────────────────────────────────
  protected system: SystemSettings = {
    appName: '', defaultFee: 0, sessionDuration: 0,
    maintenanceMode: false, doctorRegistration: false,
    allowPatientCancel: false, autoConfirmBookings: false,
  };

  protected notifications: NotificationSettings = {
    emailOnNewBooking: false, emailOnCancel: false,
    smsOnReminder: false, reminderHoursBefore: 24, adminEmailsRaw: '',
  };

  protected appearance: AppearanceSettings = {
    primaryColor: '#2563eb', language: 'ar',
    timezone: 'Africa/Cairo', dateFormat: 'DD/MM/YYYY',
  };

  ngOnInit(): void {
    this.svc.getSettings().subscribe({
      next: (bundle: SettingsBundle) => {
        this.system        = { ...bundle.system };
        this.notifications = { ...bundle.notifications };
        this.appearance    = { ...bundle.appearance };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Tab ───────────────────────────────────────────────────────────────────
  protected setTab(tab: ActiveTab): void { this.activeTab.set(tab); }

  // ── Save handlers ─────────────────────────────────────────────────────────
  protected saveSystem(): void {
    this.savingSystem.set(true);
    this.svc.saveSystem(this.system).subscribe({
      next: (msg) => { this.toast.success(msg); this.savingSystem.set(false); },
      error: ()    => { this.toast.error('فشل الحفظ'); this.savingSystem.set(false); },
    });
  }

  protected saveNotifications(): void {
    this.savingNotif.set(true);
    this.svc.saveNotifications(this.notifications).subscribe({
      next: (msg) => { this.toast.success(msg); this.savingNotif.set(false); },
      error: ()    => { this.toast.error('فشل الحفظ'); this.savingNotif.set(false); },
    });
  }

  protected saveAppearance(): void {
    this.savingApp.set(true);
    this.svc.saveAppearance(this.appearance).subscribe({
      next: (msg) => { this.toast.success(msg); this.savingApp.set(false); },
      error: ()    => { this.toast.error('فشل الحفظ'); this.savingApp.set(false); },
    });
  }
}
