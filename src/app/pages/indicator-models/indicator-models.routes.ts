import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { IndicatorModelsPage } from './indicator-models.page';
import { IndicatorModelListComponent } from '@features/indicator-models/ui/indicator-model-list.component';
import { IndicatorModelDetailComponent } from '@features/indicator-models/ui/indicator-model-detail.component';
import { IndicatorModelFormComponent } from '@features/indicator-models/ui/indicator-model-form.component';

export const indicatorModelsRoutes: Routes = [
  {
    path: '',
    component: IndicatorModelsPage,
    children: [
      { path: '', component: IndicatorModelListComponent },
      { path: 'new', component: IndicatorModelFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: IndicatorModelDetailComponent },
      { path: ':id/edit', component: IndicatorModelFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
