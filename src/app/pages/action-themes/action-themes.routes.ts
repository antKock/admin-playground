import { Routes } from '@angular/router';

import { ActionThemesPage } from './action-themes.page';
import { ActionThemeListComponent } from '@features/action-themes/ui/action-theme-list.component';
import { ActionThemeDetailComponent } from '@features/action-themes/ui/action-theme-detail.component';
import { ActionThemeFormComponent } from '@features/action-themes/ui/action-theme-form.component';

export const actionThemesRoutes: Routes = [
  {
    path: '',
    component: ActionThemesPage,
    children: [
      { path: '', component: ActionThemeListComponent },
      { path: 'new', component: ActionThemeFormComponent },
      { path: ':id', component: ActionThemeDetailComponent },
      { path: ':id/edit', component: ActionThemeFormComponent },
    ],
  },
];
