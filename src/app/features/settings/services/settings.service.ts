import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SettingsBundle, SystemSettings, NotificationSettings, AppearanceSettings } from '../models/settings.model';

const MOCK_BUNDLE: SettingsBundle = {
  system: {
    appName:             'سهاتي — Sehaty Medical',
    defaultFee:          250,
    sessionDuration:     30,
    maintenanceMode:     false,
    doctorRegistration:  true,
    allowPatientCancel:  true,
    autoConfirmBookings: false,
  },
  notifications: {
    emailOnNewBooking:   true,
    emailOnCancel:       true,
    smsOnReminder:       false,
    reminderHoursBefore: 24,
    adminEmailsRaw:      'admin@sehaty.com',
  },
  appearance: {
    primaryColor: '#2563eb',
    language:     'ar',
    timezone:     'Africa/Cairo',
    dateFormat:   'DD/MM/YYYY',
  },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {

  // TODO: GET /api/settings
  getSettings(): Observable<SettingsBundle> {
    return of(structuredClone(MOCK_BUNDLE)).pipe(delay(400));
  }

  // TODO: PUT /api/settings/system
  saveSystem(data: SystemSettings): Observable<string> {
    return of('تم حفظ إعدادات النظام بنجاح').pipe(delay(600));
  }

  // TODO: PUT /api/settings/notifications
  saveNotifications(data: NotificationSettings): Observable<string> {
    return of('تم حفظ إعدادات الإشعارات بنجاح').pipe(delay(600));
  }

  // TODO: PUT /api/settings/appearance
  saveAppearance(data: AppearanceSettings): Observable<string> {
    return of('تم حفظ إعدادات الواجهة بنجاح').pipe(delay(600));
  }
}
