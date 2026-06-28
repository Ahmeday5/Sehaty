export interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  nationalID: string | null;
  specialization: string;
  specialityId: number;
  examenPrice: number;
  doctorPersentage: number;
  gender: string;
  yearsOfExperience: number;
  profileInfo: string;
  doctorImage: string | null;
  doctorCertificate: string | null;
  isActive: boolean;
  deviceToken: string | null;
  qualification: string | null;
  clinicName: string | null;
  clinicPhone1: string | null;
  clinicPhone2: string | null;
  token: string | null;
}

export interface DoctorsListParams {
  name?:           string;
  specialization?: string;
  isActive?:       boolean;
  page:            number;
  pageSize:        number;
}

export interface DoctorsListResponse {
  total:    number;
  page:     number;
  pageSize: number;
  data:     Doctor[];
}

export interface DoctorSummary {
  id: number;
  name: string;
  specialization: string;
  doctorImage: string | null;
  isActive: boolean;
}

export interface DoctorIdNameSpec {
  id: number;
  name: string;
  specialization: string;
}

export interface CreateDoctorPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  nationalID: string;
  specialityId: number;
  examenPrice: number;
  doctorPersentage: number;
  gender: 'Male' | 'Female';
  yearsOfExperience: number;
  profileInfo: string;
  doctorImage?: File;
  doctorCertificate?: File;
}

export interface UpdateDoctorPayload {
  name?: string;
  phone?: string;
  nationalID?: string;
  specialityId?: number;
  examenPrice?: number;
  doctorPersentage?: number;
  gender?: 'Male' | 'Female';
  yearsOfExperience?: number;
  profileInfo?: string;
  doctorImage?: File;
  doctorCertificate?: File;
}
