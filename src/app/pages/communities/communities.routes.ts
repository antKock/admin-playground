import { Routes } from '@angular/router';

import { CommunitiesPage } from './communities.page';
import { CommunityListComponent } from '@features/communities/community-list.component';

export const communitiesRoutes: Routes = [
  {
    path: '',
    component: CommunitiesPage,
    children: [
      { path: '', component: CommunityListComponent },
    ],
  },
];
