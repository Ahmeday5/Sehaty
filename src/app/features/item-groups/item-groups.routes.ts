import { Routes } from '@angular/router';

export const itemGroupsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/item-groups-list/item-groups-list.component').then(
        (m) => m.ItemGroupsListComponent,
      ),
  },
];
