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
  token: string | null;
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
