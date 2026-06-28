export type TicketPriority = 'urgent' | 'normal' | 'low';
export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPartyType = 'patient' | 'doctor' | 'pharmacy';

export interface SupportKpiSummary {
  urgentCount:        number;
  openCount:          number;
  inProgressCount:    number;
  resolvedThisMonth:  number;
}

export interface SupportTicket {
  id:          number;
  title:       string;
  partyName:   string;
  partyType:   TicketPartyType;
  preview:     string;
  priority:    TicketPriority;
  status:      TicketStatus;
  timeAgo:     string;
}

export interface TicketMessage {
  id:        number;
  sender:    string;
  senderType: 'user' | 'support';
  body:      string;
  time:      string;
}

export interface TicketDetail extends SupportTicket {
  messages:  TicketMessage[];
  createdAt: string;
}

export interface TicketFilter {
  partyType: 'all' | TicketPartyType;
  priority:  'all' | TicketPriority;
  search:    string;
}
