import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './core/auth/login.component';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'funding-programs', pathMatch: 'full' },
      {
        path: 'funding-programs',
        loadChildren: () =>
          import('./pages/funding-programs/funding-programs.routes').then(
            (m) => m.fundingProgramsRoutes,
          ),
      },
      {
        path: 'action-themes',
        loadChildren: () =>
          import('./pages/action-themes/action-themes.routes').then(
            (m) => m.actionThemesRoutes,
          ),
      },
      {
        path: 'action-models',
        loadChildren: () =>
          import('./features/action-models/action-model.routes').then(
            (m) => m.actionModelRoutes,
          ),
      },
      {
        path: 'folder-models',
        loadChildren: () =>
          import('./features/folder-models/folder-model.routes').then(
            (m) => m.folderModelRoutes,
          ),
      },
      {
        path: 'communities',
        loadChildren: () =>
          import('./features/communities/community.routes').then((m) => m.communityRoutes),
      },
      {
        path: 'agents',
        loadChildren: () =>
          import('./features/agents/agent.routes').then((m) => m.agentRoutes),
      },
      {
        path: 'indicator-models',
        loadChildren: () =>
          import('./features/indicator-models/indicator-model.routes').then(
            (m) => m.indicatorModelRoutes,
          ),
      },
    ],
  },
];
