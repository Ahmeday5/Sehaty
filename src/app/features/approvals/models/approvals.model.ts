export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DocStatus      = 'uploaded' | 'missing';

export interface ApprovalKpiSummary {
  pendingCount:     number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  acceptanceRate:   number;
}

export interface PendingApproval {
  id:            number;
  doctorName:    string;
  initial:       string;
  specialization: string;
  clinic:        string;
  degree:        string;
  phone:         string;
  docStatus:     DocStatus;
  submittedLabel: string;
}

export interface ApprovalHistoryItem {
  id:             number;
  doctorName:     string;
  specialization: string;
  decision:       'approved' | 'rejected';
  supervisor:     string;
  date:           string;
}

export interface ApprovalHistoryFilter {
  decision: 'all' | 'approved' | 'rejected';
  search:   string;
}
