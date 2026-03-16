import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { BuildingsPage } from './buildings.page';
import { BuildingListComponent } from '@features/buildings/ui/building-list.component';
import { BuildingDetailComponent } from '@features/buildings/ui/building-detail.component';
import { BuildingFormComponent } from '@features/buildings/ui/building-form.component';

export const buildingsRoutes: Routes = [
  {
    path: '',
    component: BuildingsPage,
    children: [
      { path: '', component: BuildingListComponent },
      { path: 'new', component: BuildingFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: BuildingDetailComponent },
      { path: ':id/edit', component: BuildingFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
