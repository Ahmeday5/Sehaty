export interface Pharmacy {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  isActive: boolean;
  pharmacyImage: string | null;
  createdAt: string;
  prescriptionsCount: number;
  rating: number;
}

export interface PharmacySummary {
  id: number;
  name: string;
  ownerName: string;
  isActive: boolean;
  pharmacyImage: string | null;
}

export interface CreatePharmacyPayload {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  password: string;
  pharmacyImage?: File;
}

export interface UpdatePharmacyPayload {
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  pharmacyImage?: File;
}
