import { Routes } from '@angular/router';

import { ActionThemeListComponent } from './action-theme-list.component';
import { ActionThemeDetailComponent } from './action-theme-detail.component';
import { ActionThemeFormComponent } from './action-theme-form.component';

export const actionThemeRoutes: Routes = [
  { path: '', component: ActionThemeListComponent },
  { path: 'new', component: ActionThemeFormComponent },
  { path: ':id', component: ActionThemeDetailComponent },
  { path: ':id/edit', component: ActionThemeFormComponent },
];
