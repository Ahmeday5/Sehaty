export interface Pharmacy {
  id: number;
  name: string;
  phone: string;
  address: string;
  lat: string;
  lng: string;
  imageUrl: string | null;
  isActive: boolean;
  deviceToken: string | null;
  token: string;
}

export interface PharmaciesListParams {
  name?:     string;
  phone?:    string;
  isActive?: boolean;
  page:      number;
  pageSize:  number;
}

export interface PharmaciesListResponse {
  total:    number;
  page:     number;
  pageSize: number;
  data:     Pharmacy[];
}
