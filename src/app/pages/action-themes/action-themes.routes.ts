import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

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
      { path: 'new', component: ActionThemeFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: ActionThemeDetailComponent },
      { path: ':id/edit', component: ActionThemeFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
