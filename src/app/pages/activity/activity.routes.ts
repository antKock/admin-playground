import { Routes } from '@angular/router';

import { ActivityPage } from './activity.page';
import { ActivityFeedPageComponent } from '@features/activity-feed/ui/activity-feed-page.component';
import { ActivityFeedMockupComponent } from '@features/activity-feed/ui/activity-feed-mockup.component';

export const activityRoutes: Routes = [
  {
    path: '',
    component: ActivityPage,
    children: [
      { path: '', component: ActivityFeedPageComponent },
      { path: 'mockup', component: ActivityFeedMockupComponent },
    ],
  },
];
