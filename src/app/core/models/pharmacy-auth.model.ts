export interface PharmacyLoginCredentials {
  phone: string;
  password: string;
  rememberMe?: boolean;
  deviceToken?: string;
}

export interface PharmacyRegisterPayload {
  name: string;
  password: string;
  phone: string;
  address: string;
  lat?: string;
  lng?: string;
  image?: File | null;
  deviceToken?: string;
}

export interface PharmacySession {
  id: number;
  name: string;
  phone: string;
  address: string;
  lat: string;
  lng: string;
  imageUrl: string;
  isActive: boolean;
  deviceToken?: string;
  token: string;
}
