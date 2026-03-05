import { Routes } from '@angular/router';

import { unsavedChangesGuard } from '@shared/guards/unsaved-changes.guard';

import { CommunitiesPage } from './communities.page';
import { CommunityListComponent } from '@features/communities/ui/community-list.component';
import { CommunityDetailComponent } from '@features/communities/ui/community-detail.component';
import { CommunityFormComponent } from '@features/communities/ui/community-form.component';

export const communitiesRoutes: Routes = [
  {
    path: '',
    component: CommunitiesPage,
    children: [
      { path: '', component: CommunityListComponent },
      { path: 'new', component: CommunityFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':id', component: CommunityDetailComponent },
      { path: ':id/edit', component: CommunityFormComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];
