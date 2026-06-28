export type ReviewStatus  = 'pending' | 'published' | 'deleted';
export type ReviewFilter  = 'pending' | 'all' | 'flagged' | 'low';

export interface RatingsKpiSummary {
  averageRating:   number;
  totalCount:      number;
  publishedCount:  number;
  pendingCount:    number;
  deletedThisMonth: number;
}

export interface Review {
  id:         number;
  initial:    string;
  patientName: string;
  doctorName:  string;
  dateLabel:   string;
  stars:       number;
  text:        string;
  flagged:     boolean;
  status:      ReviewStatus;
}

export interface RatingDistribution {
  star:    number;
  count:   number;
  percent: number;
  color:   'green' | 'amber' | 'red';
}

export interface DoctorRating {
  rank?:   number;
  name:    string;
  rating:  number;
  isTop:   boolean;
}
