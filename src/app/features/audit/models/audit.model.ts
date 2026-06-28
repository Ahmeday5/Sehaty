export type AuditEventType =
  | 'login' | 'logout' | 'edit' | 'delete' | 'approve_reject'
  | 'send_notification' | 'suspend' | 'export';

export type AuditRiskLevel = 'low' | 'medium' | 'high';

export interface AuditKpiSummary {
  activeSessionsCount:  number;
  actionsToday:         number;
  failedLoginsToday:    number;
  sensitiveEditsToday:  number;
}

export interface ActiveSession {
  id:        number;
  adminName: string;
  initial:   string;
  role:      string;
  browser:   string;
  ip:        string;
  sinceLabel: string;
  isCurrentUser: boolean;
}

export interface AuditLogEntry {
  id:         number;
  adminName:  string;
  initial:    string;
  action:     string;
  target:     string;
  riskLevel:  AuditRiskLevel;
  ip:         string;
  time:       string;
}

export interface AuditFilter {
  eventType:  'all' | AuditEventType;
  adminName:  'all' | string;
  dateFrom:   string;
  search:     string;
}
