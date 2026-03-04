import { Routes } from '@angular/router';

import { IndicatorModelsPage } from './indicator-models.page';
import { IndicatorModelListComponent } from '@features/indicator-models/indicator-model-list.component';

export const indicatorModelsRoutes: Routes = [
  {
    path: '',
    component: IndicatorModelsPage,
    children: [
      { path: '', component: IndicatorModelListComponent },
    ],
  },
];
