import { Routes } from '@angular/router';

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
      { path: 'new', component: ActionModelFormComponent },
      { path: ':id', component: ActionModelDetailComponent },
      { path: ':id/edit', component: ActionModelFormComponent },
    ],
  },
];
