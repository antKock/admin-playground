import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { ActionModelsPage } from './action-models.page';
import { ActionModelListComponent } from '@features/action-models/ui/action-model-list.component';
import { ActionModelDetailComponent } from '@features/action-models/ui/action-model-detail.component';
import { ActionModelFormComponent } from '@features/action-models/ui/action-model-form.component';

export const actionModelsRoutes: Routes = [
  {
    path: '',
    component: ActionModelsPage,
    children: [
      { path: '', component: ActionModelListComponent },
      { path: 'new', component: ActionModelFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: ActionModelDetailComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id/edit', component: ActionModelFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
