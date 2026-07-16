export interface MasterItem {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  unitDefault: string;
  defaultConsumerPrice: number;
  imageUrl: string | null;
  alreadyAdded: boolean;
  itemGroupId: number;
  itemGroupNameAr: string;
  itemGroupNameEn: string;
}

export interface ItemGroup {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface ItemGroupsResponse {
  data: ItemGroup[];
}

export interface BrowseMasterItemsParams {
  groupId?: number;
  search?: string;
  page: number;
  pageSize: number;
}

export interface BrowseMasterItemsResponse {
  total: number;
  page: number;
  pageSize: number;
  data: MasterItem[];
}

export interface PharmacyCatalogItem {
  id: number;
  itemId: number;
  itemCode: string;
  itemNameAr: string;
  itemNameEn: string;
  unitDefault: string;
  defaultConsumerPrice: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface PharmacyCatalogParams {
  search?: string;
  isAvailable?: boolean;
  page: number;
  pageSize: number;
}

export interface PharmacyCatalogResponse {
  total: number;
  page: number;
  pageSize: number;
  data: PharmacyCatalogItem[];
}

export interface AddCatalogItemResponse {
  message: string;
  pharmacyItemId: number;
}
