import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { EntityModelsPage } from './entity-models.page';
import { EntityModelListComponent } from '@features/entity-models/ui/entity-model-list.component';
import { EntityModelDetailComponent } from '@features/entity-models/ui/entity-model-detail.component';

export const entityModelsRoutes: Routes = [
  {
    path: '',
    component: EntityModelsPage,
    children: [
      { path: '', component: EntityModelListComponent },
      { path: ':entityType', component: EntityModelDetailComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
