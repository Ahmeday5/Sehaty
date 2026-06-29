export interface Advertisement {
  id: number;
  title: string;
  imageUrl: string | null;
}

export interface AdvertisementsPage {
  total:    number;
  page:     number;
  pageSize: number;
  data:     Advertisement[];
}
