import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { SitesPage } from './sites.page';
import { SiteListComponent } from '@features/sites/ui/site-list.component';
import { SiteDetailComponent } from '@features/sites/ui/site-detail.component';
import { SiteFormComponent } from '@features/sites/ui/site-form.component';

export const sitesRoutes: Routes = [
  {
    path: '',
    component: SitesPage,
    children: [
      { path: '', component: SiteListComponent },
      { path: 'new', component: SiteFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: SiteDetailComponent },
      { path: ':id/edit', component: SiteFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
