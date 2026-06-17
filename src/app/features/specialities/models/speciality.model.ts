export interface Speciality {
  id: number;
  name: string;
  imageUrl: string | null;
}

export interface SpecialityPayload {
  id: number;
  name: string;
  imageUrl: string;
}

export interface AddSpecialityResponse {
  message: string;
  specialtyId: number;
}
