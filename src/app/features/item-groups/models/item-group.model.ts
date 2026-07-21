export enum ItemGroupLevel {
  MainSection = 1,
  MainGroup   = 2,
  SubGroup    = 3,
}

export interface ItemGroup {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  level: ItemGroupLevel;
  parentId: number | null;
  isActive: boolean;
}

/** Client-side tree node — `ItemGroup` plus lazily-loaded children for the tree UI. */
export interface ItemGroupNode extends ItemGroup {
  children: ItemGroupNode[];
  childrenLoaded: boolean;
  childrenLoading: boolean;
  expanded: boolean;
}

export interface ItemGroupsListParams {
  parentId?: number | null;
  level?: ItemGroupLevel;
  page: number;
  pageSize: number;
}

export interface ItemGroupsListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: ItemGroup[];
}

export interface ItemGroupPayload {
  code: string;
  nameAr: string;
  nameEn: string;
  level: ItemGroupLevel;
  parentId: number | null;
}

export interface UpdateItemGroupPayload extends ItemGroupPayload {
  isActive: boolean;
}

export const ITEM_GROUP_LEVEL_LABELS: Record<ItemGroupLevel, string> = {
  [ItemGroupLevel.MainSection]: 'قسم رئيسي',
  [ItemGroupLevel.MainGroup]:   'مجموعة رئيسية',
  [ItemGroupLevel.SubGroup]:    'مجموعة فرعية',
};
