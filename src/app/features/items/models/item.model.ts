export interface Item {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  itemGroupId: number;
  unitFirst: string | null;
  unitDefault: string;
  barcode: string | null;
  defaultConsumerPrice: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface ItemsListParams {
  itemGroupId?: number;
  code?: string;
  barcode?: string;
  page: number;
  pageSize: number;
}

export interface ItemsListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Item[];
}

export interface CreateItemPayload {
  code: string;
  nameAr: string;
  nameEn: string;
  itemGroupId: number;
  unitFirst?: string;
  unitDefault: string;
  barcode?: string;
  defaultConsumerPrice: number;
  image?: File;
}

export interface UpdateItemPayload {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  itemGroupId?: number;
  unitFirst?: string;
  unitDefault?: string;
  barcode?: string;
  defaultConsumerPrice?: number;
  isActive?: boolean;
  image?: File;
}
