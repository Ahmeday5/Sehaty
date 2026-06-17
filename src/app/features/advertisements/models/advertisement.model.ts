export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string | null;
}

export interface AdvertisementsResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Advertisement[];
}
