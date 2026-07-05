export interface DoctorRatingsListParams {
  stars?:      number;
  doctorName?: string;
  page:        number;
  pageSize:    number;
}

export interface DoctorRatingItem {
  id:             number;
  doctorId:       number;
  doctorName:     string;
  specialization: string;
  patientId:      number;
  patientName:    string;
  stars:          number;
  comment:        string;
  ratedAt:        string;
}

export interface DoctorRatingsListResponse {
  total:    number;
  page:     number;
  pageSize: number;
  data:     DoctorRatingItem[];
}

export interface RatingDistributionItem {
  stars:      number;
  count:      number;
  percentage: number;
}

export interface RatingsDistributionResponse {
  total: number;
  data:  RatingDistributionItem[];
}

export interface RankedDoctor {
  doctorId:      number;
  doctorName:    string;
  averageRating: number;
  ratingsCount:  number;
}

export interface TopAndWorstRatedDoctorsResponse {
  topRated:    RankedDoctor[];
  worstRated:  RankedDoctor[];
}
