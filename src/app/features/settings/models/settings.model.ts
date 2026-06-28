export interface SystemSettings {
  appName:             string;
  defaultFee:          number;
  sessionDuration:     number;
  maintenanceMode:     boolean;
  doctorRegistration:  boolean;
  allowPatientCancel:  boolean;
  autoConfirmBookings: boolean;
}

export interface NotificationSettings {
  emailOnNewBooking:   boolean;
  emailOnCancel:       boolean;
  smsOnReminder:       boolean;
  reminderHoursBefore: number;
  adminEmailsRaw:      string;
}

export interface AppearanceSettings {
  primaryColor: string;
  language:     'ar' | 'en';
  timezone:     string;
  dateFormat:   string;
}

export interface SettingsBundle {
  system:       SystemSettings;
  notifications: NotificationSettings;
  appearance:   AppearanceSettings;
}
