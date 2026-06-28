export interface Patient {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  birthday: string;
  imageUrl: string | null;
  dateOfCreation: string;
  isActive: boolean;
}

export interface PatientsResponse {
  total:    number;
  page:     number;
  pageSize: number;
  data:     Patient[];
}

export interface PatientsListParams {
  name?:        string;
  phoneNumber?: string;
  page:         number;
  pageSize:     number;
}
